import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ReservationStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

export class ReservationQueryDto extends PaginationQueryDto {
  /** Case-insensitive. @example CONFIRMED */
  @IsOptional()
  @ToUpperCase()
  @IsEnum(ReservationStatus, { message: 'Invalid reservation status filter' })
  reservationStatus?: ReservationStatus;

  /** Staff only (guests always see just their own). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId?: number;

  /** Stays that include or start on/after this date. @example 2026-12-01 */
  @IsOptional()
  @IsDateOnly()
  fromDate?: string;

  /** Stays that start on/before this date. @example 2026-12-31 */
  @IsOptional()
  @IsDateOnly()
  toDate?: string;
}
