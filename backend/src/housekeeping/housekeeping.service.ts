import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, Paginated } from '../common/dto/pagination-query.dto';
import { AccountStatus, HousekeepingStatus, Role, RoomStatus, StaffRole } from '../common/enums';
import { Room } from '../rooms/entities/room.entity';
import { Staff } from '../staff/entities/staff.entity';
import { CreateHousekeepingDto } from './dto/create-housekeeping.dto';
import { HousekeepingQueryDto } from './dto/housekeeping-query.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';
import { Housekeeping } from './entities/housekeeping.entity';
import { OPEN_TASK_STATUSES } from './housekeeping-assignment.service';

/** Only forward, one step at a time. */
const NEXT_STATUS: Record<HousekeepingStatus, HousekeepingStatus | null> = {
  [HousekeepingStatus.PENDING]: HousekeepingStatus.IN_PROGRESS,
  [HousekeepingStatus.IN_PROGRESS]: HousekeepingStatus.COMPLETED,
  [HousekeepingStatus.COMPLETED]: null,
};

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(Housekeeping) private readonly tasks: Repository<Housekeeping>,
    private readonly dataSource: DataSource,
  ) {}

  /** Step 10 — Manager assigns a cleaning task. */
  async create(dto: CreateHousekeepingDto): Promise<Housekeeping> {
    const hkId = await this.dataSource.transaction(async (em) => {
      await this.assertAssignableHousekeeper(em, dto.staffId);
      const room = await em.findOne(Room, { where: { roomId: dto.roomId }, lock: { mode: 'pessimistic_write' } });
      if (!room) throw new NotFoundException('Room not found');
      if (room.roomStatus === RoomStatus.OCCUPIED) {
        throw new ConflictException('Room is occupied; cleaning is assigned automatically at check-out');
      }
      const open = await em.existsBy(Housekeeping, { roomId: room.roomId, status: In(OPEN_TASK_STATUSES) });
      if (open) throw new ConflictException('Room already has an open housekeeping task');

      // An AVAILABLE room being cleaned is not ready for check-in until the task is done.
      if (room.roomStatus === RoomStatus.AVAILABLE) {
        await em.update(Room, { roomId: room.roomId }, { roomStatus: RoomStatus.CLEANING });
      }
      const task = em.create(Housekeeping, {
        roomId: room.roomId,
        staffId: dto.staffId,
        status: HousekeepingStatus.PENDING,
        lastUpdate: new Date(),
      });
      return (await em.save(task)).hkId;
    });
    return this.findById(hkId);
  }

  /** Housekeepers see only their own tasks; the manager sees all. */
  async findAll(query: HousekeepingQueryDto, user: AuthUser): Promise<Paginated<Housekeeping>> {
    const qb = this.tasks
      .createQueryBuilder('hk')
      .leftJoinAndSelect('hk.room', 'room')
      .leftJoinAndSelect('hk.staff', 'staff')
      .orderBy('hk.hkId', 'DESC');
    if (user.role === Role.HOUSEKEEPING) {
      qb.andWhere('hk.staffId = :ownId', { ownId: user.id });
    } else if (query.staffId) {
      qb.andWhere('hk.staffId = :staffId', { staffId: query.staffId });
    }
    if (query.status) qb.andWhere('hk.status = :status', { status: query.status });
    if (query.roomId) qb.andWhere('hk.roomId = :roomId', { roomId: query.roomId });
    const [data, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(hkId: number, user: AuthUser): Promise<Housekeeping> {
    const task = await this.findById(hkId);
    this.assertCanAccess(task, user);
    return task;
  }

  /**
   * Status updates and reassignment. When a task is COMPLETED and the room is
   * CLEANING with no other open task, the room is released (AVAILABLE).
   */
  async update(hkId: number, dto: UpdateHousekeepingDto, user: AuthUser): Promise<Housekeeping> {
    if (dto.status === undefined && dto.staffId === undefined) {
      throw new BadRequestException('Provide status and/or staffId');
    }
    if (dto.staffId !== undefined && user.role !== Role.MANAGER) {
      throw new ForbiddenException('Only a manager can reassign housekeeping tasks');
    }

    await this.dataSource.transaction(async (em) => {
      const task = await em.findOne(Housekeeping, { where: { hkId }, lock: { mode: 'pessimistic_write' } });
      if (!task) throw new NotFoundException('Housekeeping task not found');
      this.assertCanAccess(task, user);

      if (dto.staffId !== undefined && dto.staffId !== task.staffId) {
        if (task.status === HousekeepingStatus.COMPLETED) {
          throw new ConflictException('Completed tasks cannot be reassigned');
        }
        await this.assertAssignableHousekeeper(em, dto.staffId);
        task.staffId = dto.staffId;
      }

      if (dto.status !== undefined && dto.status !== task.status) {
        if (NEXT_STATUS[task.status] !== dto.status) {
          throw new ConflictException(`Invalid status transition: ${task.status} → ${dto.status}`);
        }
        task.status = dto.status;
      }
      task.lastUpdate = new Date();
      await em.save(task);

      if (task.status === HousekeepingStatus.COMPLETED) {
        await this.releaseRoomIfClean(em, task.roomId);
      }
    });
    return this.findById(hkId);
  }

  // ---------------------------------------------------------------- helpers

  private async releaseRoomIfClean(em: EntityManager, roomId: number): Promise<void> {
    const room = await em.findOne(Room, { where: { roomId }, lock: { mode: 'pessimistic_write' } });
    if (!room || room.roomStatus !== RoomStatus.CLEANING) return; // e.g. MAINTENANCE stays as is
    const stillOpen = await em.existsBy(Housekeeping, { roomId, status: In(OPEN_TASK_STATUSES) });
    if (!stillOpen) await em.update(Room, { roomId }, { roomStatus: RoomStatus.AVAILABLE });
  }

  private async assertAssignableHousekeeper(em: EntityManager, staffId: number): Promise<void> {
    const staff = await em.findOneBy(Staff, { staffId });
    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.role !== StaffRole.HOUSEKEEPING) {
      throw new BadRequestException('Cleaning tasks can only be assigned to HOUSEKEEPING staff');
    }
    if (staff.accountStatus !== AccountStatus.ACTIVE) {
      throw new ConflictException('Staff member is inactive');
    }
  }

  /** Housekeepers may only touch their own tasks; managers may touch any. */
  private assertCanAccess(task: Housekeeping, user: AuthUser): void {
    if (user.role === Role.HOUSEKEEPING && task.staffId !== user.id) {
      throw new ForbiddenException('You can only access housekeeping tasks assigned to you');
    }
  }

  private async findById(hkId: number): Promise<Housekeeping> {
    const task = await this.tasks.findOne({ where: { hkId }, relations: { room: true, staff: true } });
    if (!task) throw new NotFoundException('Housekeeping task not found');
    return task;
  }
}
