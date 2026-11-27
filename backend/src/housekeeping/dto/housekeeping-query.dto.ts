import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { HousekeepingStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';

export class HousekeepingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @ToUpperCase()
  @IsEnum(HousekeepingStatus, { message: 'Invalid housekeeping status filter' })
  status?: HousekeepingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId?: number;

  /** Manager only (housekeepers always see just their own tasks). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  staffId?: number;
}
