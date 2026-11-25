import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateHousekeepingDto } from './dto/create-housekeeping.dto';
import { HousekeepingQueryDto } from './dto/housekeeping-query.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';
import { HousekeepingService } from './housekeeping.service';

@ApiTags('Housekeeping')
@ApiBearerAuth()
@Roles(Role.HOUSEKEEPING, Role.MANAGER)
@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Roles(Role.MANAGER)
  @Post()
  @ApiOperation({ summary: 'Assign a cleaning task (Manager)' })
  @ApiResponse({ status: 201, description: 'Task created (PENDING); AVAILABLE room set to CLEANING' })
  @ApiResponse({ status: 400, description: 'Staff member is not housekeeping' })
  @ApiResponse({ status: 404, description: 'Room or staff not found' })
  @ApiResponse({ status: 409, description: 'Room occupied, already has an open task, or staff inactive' })
  create(@Body() dto: CreateHousekeepingDto) {
    return this.housekeepingService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List cleaning tasks (Housekeeping: own tasks only; Manager: all)' })
  @ApiResponse({ status: 200, description: 'Paginated tasks with room and staff' })
  findAll(@Query() query: HousekeepingQueryDto, @CurrentUser() user: AuthUser) {
    return this.housekeepingService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cleaning task (assignee or Manager)' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 403, description: "Another housekeeper's task" })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.housekeepingService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task status (PENDING→IN_PROGRESS→COMPLETED) or reassign (Manager)' })
  @ApiResponse({ status: 200, description: 'Task updated; COMPLETED releases the room to AVAILABLE' })
  @ApiResponse({ status: 403, description: "Another housekeeper's task, or non-manager reassigning" })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateHousekeepingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.housekeepingService.update(id, dto, user);
  }
}
