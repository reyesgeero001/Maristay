import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomStatus } from '../../common/enums';
import { decimalTransformer } from '../../common/utilities/money.util';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { Housekeeping } from '../../housekeeping/entities/housekeeping.entity';

/** Lab 04 Table 2 — hotel rooms, pricing and current status. */
@Entity({ name: 'rooms' })
@Index('IDX_rooms_status_type', ['roomStatus', 'roomType'])
export class Room {
  @PrimaryGeneratedColumn({ name: 'roomId', type: 'int' })
  roomId!: number;

  @Index('UQ_rooms_roomNo', { unique: true })
  @Column({ type: 'varchar', length: 10 })
  roomNo!: string;

  @Column({ type: 'varchar', length: 50 })
  roomType!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  pricePerNight!: number;

  /** Current physical status of the room (not future availability). */
  @Column({ type: 'varchar', length: 20, default: RoomStatus.AVAILABLE })
  roomStatus!: RoomStatus;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations?: Reservation[];

  @OneToMany(() => Housekeeping, (task) => task.room)
  housekeepingTasks?: Housekeeping[];
}
