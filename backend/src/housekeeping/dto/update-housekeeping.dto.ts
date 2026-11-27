import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { HousekeepingStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';

/**
 * PATCH /housekeeping/:id
 *  - Housekeeping staff: `status` of their OWN tasks (PENDING → IN_PROGRESS → COMPLETED).
 *  - Manager: `status` and/or `staffId` (reassignment of an unfinished task).
 */
export class UpdateHousekeepingDto {
  /** @example IN_PROGRESS */
  @IsOptional()
  @ToUpperCase()
  @IsEnum(HousekeepingStatus, { message: 'status must be one of: PENDING, IN_PROGRESS, COMPLETED' })
  status?: HousekeepingStatus;

  /** Manager only — reassign to another housekeeper. @example 4 */
  @IsOptional()
  @IsInt()
  @Min(1)
  staffId?: number;
}
