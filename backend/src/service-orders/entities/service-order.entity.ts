import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceOrderStatus } from '../../common/enums';
import { decimalTransformer } from '../../common/utilities/money.util';
import { Reservation } from '../../reservations/entities/reservation.entity';

/** Lab 04 Table 8 — guest requests for food, amenities and other hotel services. */
@Entity({ name: 'service_orders' })
@Index('IDX_service_orders_status', ['status'])
export class ServiceOrder {
  @PrimaryGeneratedColumn({ name: 'orderId', type: 'int' })
  orderId!: number;

  @Index('IDX_service_orders_reservation')
  @Column({ type: 'int' })
  reservationId!: number;

  /** Food, Beverage, Amenities, Laundry or Other (derived from the catalog item). */
  @Column({ type: 'varchar', length: 50 })
  serviceType!: string;

  /** Extension: catalog item ordered (see service-catalog.ts). */
  @Column({ type: 'varchar', length: 50 })
  itemCode!: string;

  /** Extension: number of units ordered. */
  @Column({ type: 'int', default: 1 })
  quantity!: number;

  /** Extension: catalog price per unit at the time of ordering. */
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  unitPrice!: number;

  /** Computed on the server: unitPrice × quantity. */
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  totalAmount!: number;

  @Column({ type: 'varchar', length: 20, default: ServiceOrderStatus.PENDING })
  status!: ServiceOrderStatus;

  /** When the order was placed. */
  @Column({ type: 'datetime' })
  date!: Date;

  /** Extension: optional guest instructions (e.g. "no onions"). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;

  @ManyToOne(() => Reservation, (reservation) => reservation.serviceOrders, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'reservationId', foreignKeyConstraintName: 'FK_service_orders_reservation' })
  reservation?: Reservation;
}
