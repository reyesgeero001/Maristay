import { IsInt, IsOptional, Min } from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

/**
 * POST /reservations (Lab 05 #3). A guest books for themself — the guestId is
 * taken from the JWT. Front Desk / Manager may book on behalf of a guest by
 * passing guestId. The status is always set by the server (PENDING).
 */
export class CreateReservationDto {
  /** @example 1 */
  @IsInt()
  @Min(1)
  roomId!: number;

  /** Arrival date (YYYY-MM-DD, today or later). @example 2026-12-20 */
  @IsDateOnly()
  checkInDate!: string;

  /** Departure date (YYYY-MM-DD, after checkInDate). @example 2026-12-22 */
  @IsDateOnly()
  checkOutDate!: string;

  /** Staff only: the guest the booking is for. Guests may omit it (or pass their own id). */
  @IsOptional()
  @IsInt()
  @Min(1)
  guestId?: number;
}
