import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';

/**
 * POST /digital-keys — issue or reissue a key for a CHECKED_IN reservation
 * (e.g. the guest changed phones). Any previous active key is revoked.
 */
export class CreateDigitalKeyDto {
  /** @example 1 */
  @IsInt()
  @Min(1)
  reservationId!: number;

  /**
   * Staff only: custom expiry (ISO 8601). Must be in the future and not after
   * 12:00 on the check-out date. Defaults to that check-out deadline.
   * @example 2026-12-22T04:00:00.000Z
   */
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'expiresAt must be a valid ISO 8601 date-time' })
  expiresAt?: Date;
}
