import { IsInt, IsOptional, Min } from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

/** PATCH /reservations/:id — change room and/or dates of a PENDING or CONFIRMED booking. */
export class UpdateReservationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number;

  /** @example 2026-12-21 */
  @IsOptional()
  @IsDateOnly()
  checkInDate?: string;

  /** @example 2026-12-23 */
  @IsOptional()
  @IsDateOnly()
  checkOutDate?: string;
}
