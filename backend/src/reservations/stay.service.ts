import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { ReservationStatus, RoomStatus, ServiceOrderStatus } from '../common/enums';
import { todayDateString } from '../common/utilities/date.util';
import { toCents } from '../common/utilities/money.util';
import { assertGuestOwnerOrStaff } from '../common/utilities/ownership.util';
import { DigitalKeysService, IssuedKey } from '../digital-keys/digital-keys.service';
import { Housekeeping } from '../housekeeping/entities/housekeeping.entity';
import { HousekeepingAssignmentService } from '../housekeeping/housekeeping-assignment.service';
import { NotificationResult, NotificationsService } from '../notifications/notifications.service';
import { BillingService, BillingSummary } from '../payments/billing.service';
import { Room } from '../rooms/entities/room.entity';
import { ServiceOrder } from '../service-orders/entities/service-order.entity';
import { Reservation } from './entities/reservation.entity';
import { BOOKING_ISOLATION } from './reservations.service';

export interface CheckInResult {
  message: string;
  reservation: Reservation;
  digitalKey: IssuedKey;
  notifications: NotificationResult[];
}

export interface CheckOutResult {
  message: string;
  reservation: Reservation;
  billing: BillingSummary;
  digitalKeysRevoked: number;
  openServiceOrdersCancelled: number;
  housekeepingTask: Housekeeping | null;
  notifications: NotificationResult[];
}

/**
 * The integrated guest-stay workflow — the heart of MariStay's systems
 * integration. Check-in and check-out each touch several modules
 * (reservations, rooms, payments, digital keys, service orders, housekeeping,
 * notifications) inside ONE database transaction, so either every change is
 * saved or none is.
 */
@Injectable()
export class StayService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly billing: BillingService,
    private readonly digitalKeys: DigitalKeysService,
    private readonly housekeeping: HousekeepingAssignmentService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Step 6 — Digital check-in.
   * Policy: allowed from the check-in date until the day before the check-out
   * date, only for CONFIRMED reservations whose room total is fully paid and
   * whose room is AVAILABLE (clean and ready).
   */
  async checkIn(reservationId: number, user: AuthUser): Promise<CheckInResult> {
    const issued = await this.dataSource.transaction(BOOKING_ISOLATION, async (em) => {
      const reservation = await this.lockReservation(em, reservationId);
      assertGuestOwnerOrStaff(user, reservation.guestId);

      switch (reservation.reservationStatus) {
        case ReservationStatus.CONFIRMED:
          break;
        case ReservationStatus.PENDING:
          throw new ConflictException('Reservation must be confirmed (fully paid) before check-in');
        case ReservationStatus.CHECKED_IN:
          throw new ConflictException('Reservation is already checked in');
        default:
          throw new ConflictException(`A ${reservation.reservationStatus} reservation cannot be checked in`);
      }

      const today = todayDateString();
      if (today < reservation.checkInDate) {
        throw new ConflictException(`Check-in opens on ${reservation.checkInDate}`);
      }
      if (today >= reservation.checkOutDate) {
        throw new ConflictException('The reservation period has already ended');
      }

      const summary = await this.billing.summarize(em, reservation);
      if (toCents(summary.paidTotal) < toCents(summary.roomTotal)) {
        throw new ConflictException(
          `Payment required before check-in: balance of ${summary.balanceDue.toFixed(2)} is still due`,
        );
      }

      const room = await em.findOne(Room, { where: { roomId: reservation.roomId }, lock: { mode: 'pessimistic_write' } });
      if (!room) throw new NotFoundException('Room not found');
      if (room.roomStatus !== RoomStatus.AVAILABLE) {
        throw new ConflictException(`Room ${room.roomNo} is not ready (status: ${room.roomStatus})`);
      }

      await em.update(Reservation, { reservationId }, { reservationStatus: ReservationStatus.CHECKED_IN });
      await em.update(Room, { roomId: room.roomId }, { roomStatus: RoomStatus.OCCUPIED });
      return this.digitalKeys.issueKey(em, reservation);
    });

    // Notifications are sent only after the transaction has committed.
    const reservation = await this.loadReservation(reservationId);
    const guest = reservation.guest!;
    const text = `Hi ${guest.firstName}, you are checked in to room ${reservation.room!.roomNo}. Your digital room key is ready in the MariStay app.`;
    const notifications = [
      this.notifications.sendSms(guest.phoneNumber, text),
      this.notifications.sendEmail(guest.email, 'MariStay check-in confirmed', text),
    ];

    return { message: 'Check-in successful', reservation, digitalKey: issued, notifications };
  }

  /**
   * Step 9 — Digital check-out.
   * Prototype charge rules: open (PENDING/PREPARING) service orders are
   * cancelled; DELIVERED orders are billed. The balance (room total + delivered
   * service charges − PAID payments) must be zero.
   * Then: reservation CHECKED_OUT, keys revoked, room CLEANING, housekeeping
   * task assigned — all in one transaction.
   */
  async checkOut(reservationId: number, user: AuthUser): Promise<CheckOutResult> {
    const outcome = await this.dataSource.transaction(BOOKING_ISOLATION, async (em) => {
      const reservation = await this.lockReservation(em, reservationId);
      assertGuestOwnerOrStaff(user, reservation.guestId);
      if (reservation.reservationStatus !== ReservationStatus.CHECKED_IN) {
        throw new ConflictException(`Only CHECKED_IN reservations can be checked out (current: ${reservation.reservationStatus})`);
      }

      const cancelled = await em.update(
        ServiceOrder,
        { reservationId, status: In([ServiceOrderStatus.PENDING, ServiceOrderStatus.PREPARING]) },
        { status: ServiceOrderStatus.CANCELLED },
      );

      const billing = await this.billing.summarize(em, reservation);
      if (billing.balanceDue > 0) {
        // Throwing rolls back the order cancellations above as well.
        throw new ConflictException(
          `Outstanding balance of ${billing.balanceDue.toFixed(2)} must be settled at the front desk before check-out`,
        );
      }

      await em.update(Reservation, { reservationId }, { reservationStatus: ReservationStatus.CHECKED_OUT });
      const keysRevoked = await this.digitalKeys.revokeActiveKeys(em, reservationId);
      await em.findOne(Room, { where: { roomId: reservation.roomId }, lock: { mode: 'pessimistic_write' } });
      await em.update(Room, { roomId: reservation.roomId }, { roomStatus: RoomStatus.CLEANING });
      const task = await this.housekeeping.assignCleaning(em, reservation.roomId);

      return { billing, keysRevoked, ordersCancelled: cancelled.affected ?? 0, task };
    });

    const reservation = await this.loadReservation(reservationId);
    const guest = reservation.guest!;
    const text = `Thank you for staying at MariStay, ${guest.firstName}! You have checked out of room ${reservation.room!.roomNo}. Your digital key has been deactivated.`;
    const notifications = [
      this.notifications.sendSms(guest.phoneNumber, text),
      this.notifications.sendEmail(guest.email, 'MariStay check-out receipt', text),
    ];

    return {
      message: outcome.task
        ? 'Check-out successful; room sent for cleaning'
        : 'Check-out successful; no active housekeeper available — a manager must assign the cleaning task',
      reservation,
      billing: outcome.billing,
      digitalKeysRevoked: outcome.keysRevoked,
      openServiceOrdersCancelled: outcome.ordersCancelled,
      housekeepingTask: outcome.task,
      notifications,
    };
  }

  private async lockReservation(em: EntityManager, reservationId: number): Promise<Reservation> {
    const reservation = await em.findOne(Reservation, {
      where: { reservationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  private loadReservation(reservationId: number): Promise<Reservation> {
    return this.dataSource.getRepository(Reservation).findOneOrFail({
      where: { reservationId },
      relations: { room: true, guest: true },
    });
  }
}
