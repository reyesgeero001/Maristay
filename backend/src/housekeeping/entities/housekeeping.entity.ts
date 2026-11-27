import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HousekeepingStatus } from '../../common/enums';
import { Room } from '../../rooms/entities/room.entity';
import { Staff } from '../../staff/entities/staff.entity';

/** Lab 04 Table 6 — room cleaning tasks and the housekeeper assigned to them. */
@Entity({ name: 'housekeeping' })
@Index('IDX_housekeeping_room_status', ['roomId', 'status'])
@Index('IDX_housekeeping_staff_status', ['staffId', 'status'])
export class Housekeeping {
  @PrimaryGeneratedColumn({ name: 'hkId', type: 'int' })
  hkId!: number;

  @Column({ type: 'int' })
  roomId!: number;

  @Column({ type: 'int' })
  staffId!: number;

  @Column({ type: 'varchar', length: 20, default: HousekeepingStatus.PENDING })
  status!: HousekeepingStatus;

  /** Time of the last status change. */
  @Column({ type: 'datetime' })
  lastUpdate!: Date;

  /** Extension: when the task was assigned. */
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @ManyToOne(() => Room, (room) => room.housekeepingTasks, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'roomId', foreignKeyConstraintName: 'FK_housekeeping_room' })
  room?: Room;

  @ManyToOne(() => Staff, (staff) => staff.housekeepingTasks, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'staffId', foreignKeyConstraintName: 'FK_housekeeping_staff' })
  staff?: Staff;
}
