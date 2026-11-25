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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateStaffDto } from './dto/create-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

/** Staff Management — full CRUD, Manager only. */
@ApiTags('Staff')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Create a staff account (Manager)' })
  @ApiResponse({ status: 201, description: 'Staff account created (no password hash returned)' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Not a manager' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List staff with role/status filters (Manager)' })
  @ApiResponse({ status: 200, description: 'Paginated staff list' })
  findAll(@Query() query: StaffQueryDto) {
    return this.staffService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff details (Manager)' })
  @ApiResponse({ status: 200, description: 'Staff member' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff details, role, status or reset password (Manager)' })
  @ApiResponse({ status: 200, description: 'Staff member updated' })
  @ApiResponse({ status: 403, description: 'Manager tried to demote or deactivate themself' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiResponse({ status: 409, description: 'Email exists, or housekeeper still has open tasks' })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateStaffDto, @CurrentUser() user: AuthUser) {
    return this.staffService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a staff account (Manager). History is kept.' })
  @ApiResponse({ status: 204, description: 'Staff account deactivated' })
  @ApiResponse({ status: 403, description: 'Cannot deactivate yourself' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiResponse({ status: 409, description: 'Housekeeper still has open tasks' })
  async deactivate(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    await this.staffService.deactivate(id, user);
  }
}
