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
import { AccountStatus, StaffRole } from '../../common/enums';
import { Housekeeping } from '../../housekeeping/entities/housekeeping.entity';

/** Lab 04 Table 7 — hotel employees and their roles. */
@Entity({ name: 'staff' })
export class Staff {
  @PrimaryGeneratedColumn({ name: 'staffId', type: 'int' })
  staffId!: number;

  @Column({ type: 'varchar', length: 50 })
  firstName!: string;

  @Column({ type: 'varchar', length: 50 })
  lastName!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: StaffRole;

  @Index('UQ_staff_email', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  email!: string;

  /** Extension (required for staff login). Never selected by default or serialized. */
  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  /** Extension: deactivated staff can no longer log in. */
  @Column({ type: 'varchar', length: 20, default: AccountStatus.ACTIVE })
  accountStatus!: AccountStatus;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @OneToMany(() => Housekeeping, (task) => task.staff)
  housekeepingTasks?: Housekeeping[];
}
