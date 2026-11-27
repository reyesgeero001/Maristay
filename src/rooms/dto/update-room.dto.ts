import { PartialType } from '@nestjs/mapped-types';
import { ReplaceRoomDto } from './replace-room.dto';

/** PATCH /rooms/:id (Lab 05 #6) — partial update, e.g. { "roomStatus": "Available" }. */
export class UpdateRoomDto extends PartialType(ReplaceRoomDto) {}
