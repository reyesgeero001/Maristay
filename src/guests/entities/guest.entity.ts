import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountStatus } from '../../common/enums';
import { Reservation } from '../../reservations/entities/reservation.entity';

/** Lab 04 Table 1 — registered hotel guests and their login credentials. */
@Entity({ name: 'guests' })
export class Guest {
  @PrimaryGeneratedColumn({ name: 'guestId', type: 'int' })
  guestId!: number;

  @Column({ type: 'varchar', length: 50 })
  firstName!: string;

  @Column({ type: 'varchar', length: 50 })
  lastName!: string;

  @Index('UQ_guests_email', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  email!: string;

  /** bcrypt hash — never selected by default and never serialized. */
  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber!: string;

  /** Extension: lets the hotel deactivate an account without deleting history. */
  @Column({ type: 'varchar', length: 20, default: AccountStatus.ACTIVE })
  accountStatus!: AccountStatus;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.guest)
  reservations?: Reservation[];
}
