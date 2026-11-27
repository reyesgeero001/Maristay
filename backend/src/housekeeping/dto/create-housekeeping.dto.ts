import { IsInt, Min } from 'class-validator';

/** POST /housekeeping — Manager assigns a cleaning task to a housekeeper. */
export class CreateHousekeepingDto {
  /** @example 4 */
  @IsInt()
  @Min(1)
  roomId!: number;

  /** Must be an ACTIVE staff member with role HOUSEKEEPING. @example 3 */
  @IsInt()
  @Min(1)
  staffId!: number;
}
