import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PaymentStatus, ServiceOrderStatus } from '../common/enums';
import { fromCents, toCents } from '../common/utilities/money.util';
import { Payment } from './entities/payment.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ServiceOrder } from '../service-orders/entities/service-order.entity';

export interface BillingSummary {
  /** Quoted room total stored on the reservation. */
  roomTotal: number;
  /** DELIVERED service orders (cancelled/open orders are not billed). */
  serviceCharges: number;
  /** roomTotal + serviceCharges */
  totalBillable: number;
  /** Sum of PAID payments only — FAILED, PENDING and REFUNDED never count. */
  paidTotal: number;
  /** totalBillable − paidTotal (never negative). */
  balanceDue: number;
  /** paidTotal − totalBillable when the guest has paid too much (e.g. after cancelling). */
  overpaid: number;
}

/**
 * Prototype billing rules shared by payments, check-in and check-out.
 * Every method takes the caller's EntityManager so the numbers are read inside
 * the same database transaction that acts on them.
 */
@Injectable()
export class BillingService {
  async summarize(em: EntityManager, reservation: Reservation): Promise<BillingSummary> {
    const paid = await em
      .createQueryBuilder(Payment, 'p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.reservationId = :id', { id: reservation.reservationId })
      .andWhere('p.status = :paid', { paid: PaymentStatus.PAID })
      .getRawOne<{ total: string }>();

    const services = await em
      .createQueryBuilder(ServiceOrder, 'o')
      .select('COALESCE(SUM(o.totalAmount), 0)', 'total')
      .where('o.reservationId = :id', { id: reservation.reservationId })
      .andWhere('o.status = :delivered', { delivered: ServiceOrderStatus.DELIVERED })
      .getRawOne<{ total: string }>();

    const roomCents = toCents(reservation.totalAmount);
    const serviceCents = toCents(Number(services?.total ?? 0));
    const paidCents = toCents(Number(paid?.total ?? 0));
    const billableCents = roomCents + serviceCents;

    return {
      roomTotal: fromCents(roomCents),
      serviceCharges: fromCents(serviceCents),
      totalBillable: fromCents(billableCents),
      paidTotal: fromCents(paidCents),
      balanceDue: fromCents(Math.max(0, billableCents - paidCents)),
      overpaid: fromCents(Math.max(0, paidCents - billableCents)),
    };
  }
}
