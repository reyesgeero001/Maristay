import { IsInt, IsString, Matches, Min } from 'class-validator';

/** POST /digital-keys/validate — simulated smart-lock check at a room door. */
export class ValidateDigitalKeyDto {
  /** The credential returned at check-in / reissue. @example MSK-3q2Zk... */
  @IsString()
  @Matches(/^MSK-[A-Za-z0-9_-]{20,100}$/, { message: 'keyCode has an invalid format' })
  keyCode!: string;

  /** The room whose door is being opened. @example 3 */
  @IsInt()
  @Min(1)
  roomId!: number;
}
