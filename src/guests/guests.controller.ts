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
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateGuestDto } from './dto/create-guest.dto';
import { GuestQueryDto } from './dto/guest-query.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { GuestsService } from './guests.service';

@ApiTags('Guests')
@ApiBearerAuth()
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Register a new guest account (public, Lab 05 #2)' })
  @ApiResponse({ status: 201, description: 'Guest registered (password hash is never returned)' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  register(@Body() dto: CreateGuestDto) {
    return this.guestsService.register(dto);
  }

  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Get()
  @ApiOperation({ summary: 'List guests with search and pagination (Front Desk, Manager)' })
  @ApiResponse({ status: 200, description: 'Paginated guest list' })
  @ApiResponse({ status: 403, description: 'Role not allowed' })
  findAll(@Query() query: GuestQueryDto) {
    return this.guestsService.findAll(query);
  }

  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'Get a guest profile (own profile, or Front Desk / Manager)' })
  @ApiResponse({ status: 200, description: 'Guest profile' })
  @ApiResponse({ status: 403, description: "Another guest's profile" })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.guestsService.findOne(id, user);
  }

  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a guest profile (owner, Front Desk, Manager)' })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 403, description: 'Not the owner / not allowed to change status or password' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateGuestDto, @CurrentUser() user: AuthUser) {
    return this.guestsService.update(id, dto, user);
  }

  @Roles(Role.GUEST, Role.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a guest account (owner or Manager). History is kept.' })
  @ApiResponse({ status: 204, description: 'Account deactivated' })
  @ApiResponse({ status: 409, description: 'Guest still has active reservations' })
  async deactivate(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    await this.guestsService.deactivate(id, user);
  }

  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Get(':id/reservations')
  @ApiOperation({ summary: "Get a guest's reservation history (Lab 05 nested resource)" })
  @ApiResponse({ status: 200, description: 'Paginated reservations with room details' })
  @ApiResponse({ status: 403, description: "Another guest's history" })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  findReservations(
    @Param('id', ParseIdPipe) id: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.guestsService.findReservations(id, user, query);
  }
}
