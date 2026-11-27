import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateRoomDto } from './dto/create-room.dto';
import { ReplaceRoomDto } from './dto/replace-room.dto';
import { RoomQueryDto } from './dto/room-query.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

/**
 * Room Management — the full CRUD module used in the video demonstration.
 * Request flow: Postman -> RoomsController -> RoomsService -> Repository<Room> -> MySQL `rooms`.
 */
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /** List and filter rooms (public, Lab 05 #1). Example: ?roomStatus=Available */
  @Public()
  @Get()
  findAll(@Query() query: RoomQueryDto) {
    return this.roomsService.findAll(query);
  }

  /** Get room details (public) */
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  /** Create a room (Manager) */
  @Roles(Role.MANAGER)
  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  /** Partially update a room (Manager, Lab 05 #6) */
  @Roles(Role.MANAGER)
  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  /** Replace all room details (Manager, Lab 05 #7) */
  @Roles(Role.MANAGER)
  @Put(':id')
  replace(@Param('id', ParseIdPipe) id: number, @Body() dto: ReplaceRoomDto) {
    return this.roomsService.replace(id, dto);
  }

  /** Delete a room that has no reservation/housekeeping history (Manager) */
  @Roles(Role.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIdPipe) id: number) {
    await this.roomsService.remove(id);
  }
}
