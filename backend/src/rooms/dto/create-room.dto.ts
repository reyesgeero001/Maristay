import { IsIn, IsOptional } from 'class-validator';
import { RoomStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';
import { MANUAL_ROOM_STATUSES, ReplaceRoomDto } from './replace-room.dto';
import { OmitType } from '@nestjs/mapped-types';

/** POST /rooms — roomStatus is optional and defaults to AVAILABLE. */
export class CreateRoomDto extends OmitType(ReplaceRoomDto, ['roomStatus'] as const) {
  /** @example AVAILABLE */
  @IsOptional()
  @ToUpperCase()
  @IsIn(MANUAL_ROOM_STATUSES, {
    message: `roomStatus must be one of: ${MANUAL_ROOM_STATUSES.join(', ')} (OCCUPIED is set by check-in)`,
  })
  roomStatus?: RoomStatus;
}
