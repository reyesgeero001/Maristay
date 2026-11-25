import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, Paginated } from '../common/dto/pagination-query.dto';
import {
  AccountStatus,
  ACTIVE_RESERVATION_STATUSES,
  ReservationStatus,
  RoomStatus,
} from '../common/enums';
import { nightsBetween, todayDateString } from '../common/utilities/date.util';
import { fromCents, toCents } from '../common/utilities/money.util';
import { assertGuestOwnerOrStaff, isGuest } from '../common/utilities/ownership.util';
import { Guest } from '../guests/entities/guest.entity';
import { BillingService } from '../payments/billing.service';
import { Room } from '../rooms/entities/room.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Reservation } from './entities/reservation.entity';

/**
 * Booking transactions use READ COMMITTED so that, once the room row lock is
 * acquired, the overlap query sees every reservation committed by a competing
 * transaction (under REPEATABLE READ it could read an older snapshot).
 * This works identically on MySQL 8 and MariaDB.
 */
export const BOOKING_ISOLATION = 'READ COMMITTED' as const;

/** Longest stay a single reservation may cover. */
export const MAX_NIGHTS = 30;

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation) private readonly reservations: Repository<Reservation>,
    private readonly dataSource: DataSource,
    private readonly billing: BillingService,
  ) {}

  /**
   * Step 4 — Room reservation.
   * Runs in a transaction and locks the room row (SELECT ... FOR UPDATE) before
   * checking for overlaps. Two concurrent bookings for the same room are
   * therefore processed one after the other, and the second one sees the first
   * one's reservation and is rejected with 409 — no double booking.
   */
  async create(dto: CreateReservationDto, user: AuthUser): Promise<Reservation> {
    const guestId = this.resolveGuestId(dto.guestId, user);
    this.validateStayDates(dto.checkInDate, dto.checkOutDate);

    const reservationId = await this.dataSource.transaction(BOOKING_ISOLATION, async (em) => {
      const guest = await em.findOneBy(Guest, { guestId });
      if (!guest) throw new NotFoundException('Guest not found');
      if (guest.accountStatus !== AccountStatus.ACTIVE) throw new ConflictException('Guest account is inactive');

      const room = await this.lockRoom(em, dto.roomId);
      if (room.roomStatus === RoomStatus.MAINTENANCE) {
        throw new ConflictException('Room is under maintenance and cannot be booked');
      }
      await this.assertNoOverlap(em, room.roomId, dto.checkInDate, dto.checkOutDate);

      const nights = nightsBetween(dto.checkInDate, dto.checkOutDate);
      const reservation = em.create(Reservation, {
        guestId,
        roomId: room.roomId,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        reservationStatus: ReservationStatus.PENDING,
        ratePerNight: room.pricePerNight, // price snapshot
        totalAmount: fromCents(toCents(room.pricePerNight) * nights),
      });
      return (await em.save(reservation)).reservationId;
    });
    return this.findById(reservationId);
  }

  /** Guests see only their own reservations; Front Desk / Manager see all. */
  async findAll(query: ReservationQueryDto, user: AuthUser): Promise<Paginated<Reservation>> {
    const qb = this.reservations
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.room', 'room')
      .leftJoinAndSelect('r.guest', 'guest')
      .orderBy('r.checkInDate', 'DESC')
      .addOrderBy('r.reservationId', 'DESC');

    if (isGuest(user)) {
      qb.andWhere('r.guestId = :ownId', { ownId: user.id });
    } else if (query.guestId) {
      qb.andWhere('r.guestId = :guestId', { guestId: query.guestId });
    }
    if (query.reservationStatus) qb.andWhere('r.reservationStatus = :status', { status: query.reservationStatus });
    if (query.roomId) qb.andWhere('r.roomId = :roomId', { roomId: query.roomId });
    if (query.fromDate) qb.andWhere('r.checkOutDate > :fromDate', { fromDate: query.fromDate });
    if (query.toDate) qb.andWhere('r.checkInDate <= :toDate', { toDate: query.toDate });

    const [data, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(reservationId: number, user: AuthUser): Promise<Reservation> {
    const reservation = await this.findById(reservationId);
    assertGuestOwnerOrStaff(user, reservation.guestId);
    return reservation;
  }

  /**
   * Change room and/or dates of a PENDING or CONFIRMED reservation.
   * The nightly rate snapshot is kept when the room stays the same; moving to a
   * different room uses that room's current price.
   */
  async update(reservationId: number, dto: UpdateReservationDto, user: AuthUser): Promise<Reservation> {
    if (dto.roomId === undefined && dto.checkInDate === undefined && dto.checkOutDate === undefined) {
      throw new BadRequestException('Provide at least one of roomId, checkInDate or checkOutDate');
    }

    await this.dataSource.transaction(BOOKING_ISOLATION, async (em) => {
      const reservation = await this.lockReservation(em, reservationId);
      assertGuestOwnerOrStaff(user, reservation.guestId);
      if (![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(reservation.reservationStatus)) {
        throw new ConflictException(`A ${reservation.reservationStatus} reservation can no longer be modified`);
      }

      const checkInDate = dto.checkInDate ?? reservation.checkInDate;
      const checkOutDate = dto.checkOutDate ?? reservation.checkOutDate;
      this.validateStayDates(checkInDate, checkOutDate, dto.checkInDate === undefined);

      const roomId = dto.roomId ?? reservation.roomId;
      const room = await this.lockRoom(em, roomId);
      if (room.roomStatus === RoomStatus.MAINTENANCE) {
        throw new ConflictException('Room is under maintenance and cannot be booked');
      }
      await this.assertNoOverlap(em, roomId, checkInDate, checkOutDate, reservationId);

      const rate = roomId === reservation.roomId ? reservation.ratePerNight : room.pricePerNight;
      await em.update(Reservation, { reservationId }, {
        roomId,
        checkInDate,
        checkOutDate,
        ratePerNight: rate,
        totalAmount: fromCents(toCents(rate) * nightsBetween(checkInDate, checkOutDate)),
      });
    });
    return this.findById(reservationId);
  }

  /** Front Desk / Manager confirm a PENDING booking (e.g. guaranteed, pay at hotel). */
  async confirm(reservationId: number): Promise<Reservation> {
    await this.dataSource.transaction(async (em) => {
      const reservation = await this.lockReservation(em, reservationId);
      if (reservation.reservationStatus !== ReservationStatus.PENDING) {
        throw new ConflictException(`Only PENDING reservations can be confirmed (current: ${reservation.reservationStatus})`);
      }
      await em.update(Reservation, { reservationId }, { reservationStatus: ReservationStatus.CONFIRMED });
    });
    return this.findById(reservationId);
  }

  /**
   * DELETE /reservations/:id performs a CANCELLATION — the record is kept for
   * history and reporting; it is never physically deleted.
   */
  async cancel(reservationId: number, user: AuthUser): Promise<Reservation & { refundDue: number }> {
    const refundDue = await this.dataSource.transaction(async (em) => {
      const reservation = await this.lockReservation(em, reservationId);
      assertGuestOwnerOrStaff(user, reservation.guestId);
      if (![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(reservation.reservationStatus)) {
        throw new ConflictException(`A ${reservation.reservationStatus} reservation cannot be cancelled`);
      }
      await em.update(Reservation, { reservationId }, { reservationStatus: ReservationStatus.CANCELLED });
      // Money already PAID is reported so the front desk can refund it (PATCH /payments/:id → REFUNDED).
      return (await this.billing.summarize(em, reservation)).paidTotal;
    });
    return Object.assign(await this.findById(reservationId), { refundDue });
  }

  // ---------------------------------------------------------------- helpers

  async findById(reservationId: number): Promise<Reservation> {
    const reservation = await this.reservations.findOne({
      where: { reservationId },
      relations: { room: true, guest: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  private resolveGuestId(requestedGuestId: number | undefined, user: AuthUser): number {
    if (isGuest(user)) {
      if (requestedGuestId !== undefined && requestedGuestId !== user.id) {
        throw new ForbiddenException('Guests can only create reservations for themselves');
      }
      return user.id;
    }
    if (requestedGuestId === undefined) {
      throw new BadRequestException('guestId is required when staff create a reservation');
    }
    return requestedGuestId;
  }

  /** Dates are YYYY-MM-DD strings, which compare correctly as text. */
  private validateStayDates(checkInDate: string, checkOutDate: string, allowPastCheckIn = false): void {
    if (!allowPastCheckIn && checkInDate < todayDateString()) {
      throw new BadRequestException('checkInDate cannot be in the past');
    }
    if (checkOutDate <= checkInDate) {
      throw new BadRequestException('checkOutDate must be later than checkInDate');
    }
    if (nightsBetween(checkInDate, checkOutDate) > MAX_NIGHTS) {
      throw new BadRequestException(`A reservation cannot exceed ${MAX_NIGHTS} nights`);
    }
  }

  private async lockRoom(em: EntityManager, roomId: number): Promise<Room> {
    const room = await em.findOne(Room, { where: { roomId }, lock: { mode: 'pessimistic_write' } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  private async lockReservation(em: EntityManager, reservationId: number): Promise<Reservation> {
    const reservation = await em.findOne(Reservation, {
      where: { reservationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  /** Half-open overlap: [a, b) and [c, d) overlap when a < d AND b > c. */
  private async assertNoOverlap(
    em: EntityManager,
    roomId: number,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: number,
  ): Promise<void> {
    const qb = em
      .createQueryBuilder(Reservation, 'r')
      .where('r.roomId = :roomId', { roomId })
      .andWhere('r.reservationStatus IN (:...active)', { active: ACTIVE_RESERVATION_STATUSES })
      .andWhere('r.checkInDate < :checkOutDate', { checkOutDate })
      .andWhere('r.checkOutDate > :checkInDate', { checkInDate });
    if (excludeReservationId) qb.andWhere('r.reservationId <> :exclude', { exclude: excludeReservationId });

    if (await qb.getExists()) {
      throw new ConflictException('Room already booked for the selected dates');
    }
  }
}
