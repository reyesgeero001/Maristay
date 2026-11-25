import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReservationStatus } from '../../common/enums';
import { decimalTransformer } from '../../common/utilities/money.util';
import { Guest } from '../../guests/entities/guest.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { DigitalKey } from '../../digital-keys/entities/digital-key.entity';
import { ServiceOrder } from '../../service-orders/entities/service-order.entity';

/** Lab 04 Table 3 — room bookings and their check-in/check-out schedule. */
@Entity({ name: 'reservations' })
// Speeds up the overlap check: "active reservations of room X between dates"
@Index('IDX_reservations_room_dates', ['roomId', 'checkInDate', 'checkOutDate'])
@Index('IDX_reservations_status', ['reservationStatus'])
export class Reservation {
  @PrimaryGeneratedColumn({ name: 'reservationId', type: 'int' })
  reservationId!: number;

  @Index('IDX_reservations_guest')
  @Column({ type: 'int' })
  guestId!: number;

  @Column({ type: 'int' })
  roomId!: number;

  /** Calendar dates (YYYY-MM-DD). The stay is the half-open range [checkIn, checkOut). */
  @Column({ type: 'date' })
  checkInDate!: string;

  @Column({ type: 'date' })
  checkOutDate!: string;

  @Column({ type: 'varchar', length: 20, default: ReservationStatus.PENDING })
  reservationStatus!: ReservationStatus;

  /** Extension: nightly rate captured at booking time (price snapshot). */
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  ratePerNight!: number;

  /** Extension: quoted room total = ratePerNight × nights. */
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  totalAmount!: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @ManyToOne(() => Guest, (guest) => guest.reservations, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'guestId', foreignKeyConstraintName: 'FK_reservations_guest' })
  guest?: Guest;

  @ManyToOne(() => Room, (room) => room.reservations, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'roomId', foreignKeyConstraintName: 'FK_reservations_room' })
  room?: Room;

  @OneToMany(() => Payment, (payment) => payment.reservation)
  payments?: Payment[];

  @OneToMany(() => DigitalKey, (key) => key.reservation)
  digitalKeys?: DigitalKey[];

  @OneToMany(() => ServiceOrder, (order) => order.reservation)
  serviceOrders?: ServiceOrder[];
}
