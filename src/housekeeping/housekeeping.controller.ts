import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateHousekeepingDto } from './dto/create-housekeeping.dto';
import { HousekeepingQueryDto } from './dto/housekeeping-query.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';
import { HousekeepingService } from './housekeeping.service';

@Roles(Role.HOUSEKEEPING, Role.MANAGER)
@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  /** Assign a cleaning task (Manager) */
  @Roles(Role.MANAGER)
  @Post()
  create(@Body() dto: CreateHousekeepingDto) {
    return this.housekeepingService.create(dto);
  }

  /** List cleaning tasks (Housekeeping: own tasks only; Manager: all) */
  @Get()
  findAll(@Query() query: HousekeepingQueryDto, @CurrentUser() user: AuthUser) {
    return this.housekeepingService.findAll(query, user);
  }

  /** Get a cleaning task (assignee or Manager) */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.housekeepingService.findOne(id, user);
  }

  /** Update task status (PENDING→IN_PROGRESS→COMPLETED) or reassign (Manager) */
  @Patch(':id')
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateHousekeepingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.housekeepingService.update(id, dto, user);
  }
}
