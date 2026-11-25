import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AccountStatus, HousekeepingStatus, StaffRole } from '../common/enums';
import { Staff } from '../staff/entities/staff.entity';
import { Housekeeping } from './entities/housekeeping.entity';

export const OPEN_TASK_STATUSES = [HousekeepingStatus.PENDING, HousekeepingStatus.IN_PROGRESS];

/**
 * Automatic cleaning assignment used by the check-out workflow.
 *
 * Documented assignment rule: the task goes to the ACTIVE housekeeping
 * employee with the FEWEST open (PENDING / IN_PROGRESS) tasks; ties go to the
 * lowest staffId. If the room already has an open task, that task is reused.
 * If there is no active housekeeper, no task is created and the manager
 * assigns one manually with POST /housekeeping.
 */
@Injectable()
export class HousekeepingAssignmentService {
  async assignCleaning(em: EntityManager, roomId: number): Promise<Housekeeping | null> {
    const existing = await em
      .createQueryBuilder(Housekeeping, 'hk')
      .where('hk.roomId = :roomId', { roomId })
      .andWhere('hk.status IN (:...open)', { open: OPEN_TASK_STATUSES })
      .getOne();
    if (existing) return existing;

    const candidate = await em
      .createQueryBuilder(Staff, 's')
      .leftJoin(Housekeeping, 'hk', 'hk.staffId = s.staffId AND hk.status IN (:...open)', {
        open: OPEN_TASK_STATUSES,
      })
      .where('s.role = :role', { role: StaffRole.HOUSEKEEPING })
      .andWhere('s.accountStatus = :active', { active: AccountStatus.ACTIVE })
      .groupBy('s.staffId')
      .orderBy('COUNT(hk.hkId)', 'ASC')
      .addOrderBy('s.staffId', 'ASC')
      .getOne();
    if (!candidate) return null;

    const task = em.create(Housekeeping, {
      roomId,
      staffId: candidate.staffId,
      status: HousekeepingStatus.PENDING,
      lastUpdate: new Date(),
    });
    return em.save(task);
  }
}
