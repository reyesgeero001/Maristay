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
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateGuestDto } from './dto/create-guest.dto';
import { GuestQueryDto } from './dto/guest-query.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { GuestsService } from './guests.service';

@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  /** Register a new guest account (public, Lab 05 #2) */
  @Public()
  @Post()
  register(@Body() dto: CreateGuestDto) {
    return this.guestsService.register(dto);
  }

  /** List guests with search and pagination (Front Desk, Manager) */
  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Get()
  findAll(@Query() query: GuestQueryDto) {
    return this.guestsService.findAll(query);
  }

  /** Get a guest profile (own profile, or Front Desk / Manager) */
  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.guestsService.findOne(id, user);
  }

  /** Update a guest profile (owner, Front Desk, Manager) */
  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateGuestDto, @CurrentUser() user: AuthUser) {
    return this.guestsService.update(id, dto, user);
  }

  /** Deactivate a guest account (owner or Manager). History is kept. */
  @Roles(Role.GUEST, Role.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    await this.guestsService.deactivate(id, user);
  }

  /** Get a guest's reservation history (Lab 05 nested resource) */
  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Get(':id/reservations')
  findReservations(
    @Param('id', ParseIdPipe) id: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.guestsService.findReservations(id, user, query);
  }
}
