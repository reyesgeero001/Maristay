import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RoomStatus, RoomType } from '../../common/enums';
import { ToTitleCase, ToUpperCase } from '../../common/utilities/transform.util';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

/**
 * GET /rooms filters. Status/type values are case-insensitive, so the Lab 05
 * example `?roomStatus=Available` is normalized to AVAILABLE.
 * When checkInDate and checkOutDate are given, only rooms with no overlapping
 * active reservation (and not under maintenance) are returned.
 */
export class RoomQueryDto extends PaginationQueryDto {
  /** @example Available */
  @IsOptional()
  @ToUpperCase()
  @IsEnum(RoomStatus, { message: 'Invalid room status filter' })
  roomStatus?: RoomStatus;

  /** @example Deluxe */
  @IsOptional()
  @ToTitleCase()
  @IsEnum(RoomType, { message: 'Invalid room type filter' })
  roomType?: RoomType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  /** @example 2026-12-20 */
  @IsOptional()
  @IsDateOnly()
  checkInDate?: string;

  /** @example 2026-12-22 */
  @IsOptional()
  @IsDateOnly()
  checkOutDate?: string;
}
