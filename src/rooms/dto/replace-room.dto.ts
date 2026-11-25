import { IsEnum, IsIn, IsNumber, IsString, Matches, Max, Min } from 'class-validator';
import { RoomStatus, RoomType } from '../../common/enums';
import { ToTitleCase, ToUpperCase } from '../../common/utilities/transform.util';

/** Statuses a manager may set by hand. OCCUPIED is set only by the check-in workflow. */
export const MANUAL_ROOM_STATUSES = [RoomStatus.AVAILABLE, RoomStatus.CLEANING, RoomStatus.MAINTENANCE];

/**
 * PUT /rooms/:id (Lab 05 #7) — replaces ALL mutable room details,
 * so every field is required.
 */
export class ReplaceRoomDto {
  /** Unique room number (letters, digits, dash). @example 101 */
  @ToUpperCase()
  @IsString()
  @Matches(/^[A-Z0-9-]{1,10}$/, { message: 'roomNo must be 1–10 letters, digits or dashes' })
  roomNo!: string;

  /** Case-insensitive; stored as Standard, Deluxe, Suite or Family. @example Deluxe */
  @ToTitleCase()
  @IsEnum(RoomType, { message: `roomType must be one of: ${Object.values(RoomType).join(', ')}` })
  roomType!: RoomType;

  /** Nightly rate in PHP (max 2 decimals). @example 2500 */
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(1_000_000)
  pricePerNight!: number;

  /** Case-insensitive ("Available" works). OCCUPIED cannot be set manually. @example AVAILABLE */
  @ToUpperCase()
  @IsIn(MANUAL_ROOM_STATUSES, {
    message: `roomStatus must be one of: ${MANUAL_ROOM_STATUSES.join(', ')} (OCCUPIED is set by check-in)`,
  })
  roomStatus!: RoomStatus;
}
