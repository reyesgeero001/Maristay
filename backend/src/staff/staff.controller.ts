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
  Query,
} from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateStaffDto } from './dto/create-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

/** Staff Management — full CRUD, Manager only. */
@Roles(Role.MANAGER)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /** Create a staff account (Manager) */
  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  /** List staff with role/status filters (Manager) */
  @Get()
  findAll(@Query() query: StaffQueryDto) {
    return this.staffService.findAll(query);
  }

  /** Get staff details (Manager) */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.staffService.findOne(id);
  }

  /** Update staff details, role, status or reset password (Manager) */
  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateStaffDto, @CurrentUser() user: AuthUser) {
    return this.staffService.update(id, dto, user);
  }

  /** Deactivate a staff account (Manager). History is kept. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    await this.staffService.deactivate(id, user);
  }
}
