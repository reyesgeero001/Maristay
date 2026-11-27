import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../../common/enums';
import { decimalTransformer } from '../../common/utilities/money.util';
import { Reservation } from '../../reservations/entities/reservation.entity';

/**
 * Lab 04 Table 4 — payments recorded against a reservation.
 * Prototype only: no card numbers are collected and no money moves.
 */
@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn({ name: 'paymentId', type: 'int' })
  paymentId!: number;

  @Index('IDX_payments_reservation')
  @Column({ type: 'int' })
  reservationId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  amount!: number;

  @Column({ type: 'varchar', length: 30 })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  /** When the payment was processed; NULL while still PENDING. */
  @Column({ type: 'datetime', nullable: true })
  date!: Date | null;

  /** Extension: when the record was created (audit trail). */
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @ManyToOne(() => Reservation, (reservation) => reservation.payments, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'reservationId', foreignKeyConstraintName: 'FK_payments_reservation' })
  reservation?: Reservation;
}
