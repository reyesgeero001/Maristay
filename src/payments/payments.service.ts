import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, Paginated } from '../common/dto/pagination-query.dto';
import { PaymentStatus, ReservationStatus } from '../common/enums';
import { toCents } from '../common/utilities/money.util';
import { assertGuestOwnerOrStaff, isGuest } from '../common/utilities/ownership.util';
import { Reservation } from '../reservations/entities/reservation.entity';
import { BillingService, BillingSummary } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';

export type PaymentWithBilling = Payment & { reservationStatus: ReservationStatus; billing: BillingSummary };

/** Valid status changes. Anything else is rejected with 409. */
const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.REFUNDED]: [],
};

/** Reservations that can still receive payments. */
const PAYABLE_STATUSES = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN];

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    private readonly billing: BillingService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Step 5 — Payment recording (simulated, no real money moves).
   * In one transaction: lock the reservation, validate the amount against the
   * outstanding balance, save the payment and, when the room total is now
   * fully paid, move a PENDING reservation to CONFIRMED.
   */
  async create(dto: CreatePaymentDto): Promise<PaymentWithBilling> {
    const status = dto.status ?? PaymentStatus.PAID;

    const paymentId = await this.dataSource.transaction(async (em) => {
      const reservation = await this.lockReservation(em, dto.reservationId);
      if (!PAYABLE_STATUSES.includes(reservation.reservationStatus)) {
        throw new ConflictException(`Cannot record a payment for a ${reservation.reservationStatus} reservation`);
      }
      if (status === PaymentStatus.PAID) {
        await this.assertWithinBalance(em, reservation, dto.amount);
      }

      const payment = em.create(Payment, {
        reservationId: reservation.reservationId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        status,
        date: status === PaymentStatus.PENDING ? null : new Date(), // processed time
      });
      const saved = await em.save(payment);
      await this.confirmIfFullyPaid(em, reservation);
      return saved.paymentId;
    });
    return this.withBilling(paymentId);
  }

  async findAll(query: PaymentQueryDto, user: AuthUser): Promise<Paginated<Payment>> {
    const qb = this.payments
      .createQueryBuilder('p')
      .innerJoin('p.reservation', 'r')
      .orderBy('p.paymentId', 'DESC');
    if (isGuest(user)) qb.andWhere('r.guestId = :ownId', { ownId: user.id }); // own payments only
    if (query.reservationId) qb.andWhere('p.reservationId = :rid', { rid: query.reservationId });
    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.paymentMethod) qb.andWhere('p.paymentMethod = :method', { method: query.paymentMethod });

    const [data, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(paymentId: number, user: AuthUser): Promise<Payment> {
    const payment = await this.payments.findOne({ where: { paymentId }, relations: { reservation: true } });
    if (!payment) throw new NotFoundException('Payment not found');
    assertGuestOwnerOrStaff(user, payment.reservation!.guestId);
    return payment;
  }

  /** Payment verification by the front desk (status transitions only). */
  async updateStatus(paymentId: number, dto: UpdatePaymentDto): Promise<PaymentWithBilling> {
    await this.dataSource.transaction(async (em) => {
      const payment = await em.findOne(Payment, { where: { paymentId }, lock: { mode: 'pessimistic_write' } });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status === dto.status) return; // idempotent

      if (!PAYMENT_TRANSITIONS[payment.status].includes(dto.status)) {
        throw new ConflictException(`Invalid payment status transition: ${payment.status} → ${dto.status}`);
      }
      const reservation = await this.lockReservation(em, payment.reservationId);

      if (dto.status === PaymentStatus.PAID) {
        if (!PAYABLE_STATUSES.includes(reservation.reservationStatus)) {
          throw new ConflictException(`Cannot accept a payment for a ${reservation.reservationStatus} reservation`);
        }
        await this.assertWithinBalance(em, reservation, payment.amount);
      }
      if (dto.status === PaymentStatus.REFUNDED) {
        // Refunds are allowed for cancelled bookings, or to return an overpayment.
        if (reservation.reservationStatus !== ReservationStatus.CANCELLED) {
          const summary = await this.billing.summarize(em, reservation);
          if (toCents(payment.amount) > toCents(summary.overpaid)) {
            throw new ConflictException(
              'Refund would leave an unpaid balance; only cancelled reservations or overpayments can be refunded',
            );
          }
        }
      }

      payment.status = dto.status;
      if (dto.status !== PaymentStatus.REFUNDED) payment.date = new Date(); // processed time
      await em.save(payment);
      await this.confirmIfFullyPaid(em, reservation);
    });
    return this.withBilling(paymentId);
  }

  // ---------------------------------------------------------------- helpers

  private async lockReservation(em: EntityManager, reservationId: number): Promise<Reservation> {
    const reservation = await em.findOne(Reservation, {
      where: { reservationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  private async assertWithinBalance(em: EntityManager, reservation: Reservation, amount: number): Promise<void> {
    const summary = await this.billing.summarize(em, reservation);
    if (summary.balanceDue <= 0) {
      throw new BadRequestException('Invalid payment information: the reservation is already fully paid');
    }
    if (toCents(amount) > toCents(summary.balanceDue)) {
      throw new BadRequestException(
        `Invalid payment information: amount exceeds the outstanding balance of ${summary.balanceDue.toFixed(2)}`,
      );
    }
  }

  /** PENDING → CONFIRMED once PAID payments cover the quoted room total. */
  private async confirmIfFullyPaid(em: EntityManager, reservation: Reservation): Promise<void> {
    if (reservation.reservationStatus !== ReservationStatus.PENDING) return;
    const summary = await this.billing.summarize(em, reservation);
    if (toCents(summary.paidTotal) >= toCents(summary.roomTotal)) {
      await em.update(
        Reservation,
        { reservationId: reservation.reservationId },
        { reservationStatus: ReservationStatus.CONFIRMED },
      );
    }
  }

  private async withBilling(paymentId: number): Promise<PaymentWithBilling> {
    return this.dataSource.transaction(async (em) => {
      const payment = await em.findOneOrFail(Payment, { where: { paymentId } });
      const reservation = await em.findOneOrFail(Reservation, { where: { reservationId: payment.reservationId } });
      const billing = await this.billing.summarize(em, reservation);
      return Object.assign(payment, { reservationStatus: reservation.reservationStatus, billing });
    });
  }
}
