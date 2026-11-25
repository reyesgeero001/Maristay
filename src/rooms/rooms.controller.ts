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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List and filter rooms (public, Lab 05 #1). Example: ?roomStatus=Available' })
  @ApiResponse({ status: 200, description: 'Paginated room list' })
  @ApiResponse({ status: 400, description: 'Invalid room status filter or date range' })
  findAll(@Query() query: RoomQueryDto) {
    return this.roomsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get room details (public)' })
  @ApiResponse({ status: 200, description: 'Room details' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create a room (Manager)' })
  @ApiResponse({ status: 201, description: 'Room created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'No / invalid token' })
  @ApiResponse({ status: 403, description: 'Not a manager' })
  @ApiResponse({ status: 409, description: 'Room number already exists' })
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a room (Manager, Lab 05 #6)' })
  @ApiResponse({ status: 200, description: 'Room updated' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 409, description: 'Duplicate room number or room is occupied' })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Put(':id')
  @ApiOperation({ summary: 'Replace all room details (Manager, Lab 05 #7)' })
  @ApiResponse({ status: 200, description: 'Room replaced' })
  @ApiResponse({ status: 400, description: 'A required field is missing or invalid' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 409, description: 'Duplicate room number or room is occupied' })
  replace(@Param('id', ParseIdPipe) id: number, @Body() dto: ReplaceRoomDto) {
    return this.roomsService.replace(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a room that has no reservation/housekeeping history (Manager)' })
  @ApiResponse({ status: 204, description: 'Room deleted' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 409, description: 'Room has history; use MAINTENANCE status instead' })
  async remove(@Param('id', ParseIdPipe) id: number) {
    await this.roomsService.remove(id);
  }
}
