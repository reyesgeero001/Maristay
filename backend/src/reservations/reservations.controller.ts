import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';
import { StayService } from './stay.service';

@Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER) // Housekeeping has no access to reservations
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly stayService: StayService,
  ) {}

  /** Book a room (Guest; Front Desk/Manager on behalf of a guest) — Lab 05 #3 */
  @Post()
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: AuthUser) {
    return this.reservationsService.create(dto, user);
  }

  /** List reservations (guests: own only; staff: all, filterable) */
  @Get()
  findAll(@Query() query: ReservationQueryDto, @CurrentUser() user: AuthUser) {
    return this.reservationsService.findAll(query, user);
  }

  /** Get one reservation (owner or Front Desk / Manager) */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.reservationsService.findOne(id, user);
  }

  /** Change room/dates of a PENDING or CONFIRMED reservation */
  @Patch(':id')
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservationsService.update(id, dto, user);
  }

  /** Confirm a PENDING reservation (Front Desk, Manager) */
  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Patch(':id/confirm')
  confirm(@Param('id', ParseIdPipe) id: number) {
    return this.reservationsService.confirm(id);
  }

  /** Digital check-in (owner or Front Desk/Manager) — issues a digital room key */
  @Patch(':id/check-in')
  checkIn(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.stayService.checkIn(id, user);
  }

  /** Digital check-out (owner or Front Desk/Manager) — revokes keys, queues cleaning */
  @Patch(':id/check-out')
  checkOut(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.stayService.checkOut(id, user);
  }

  /** Cancel a reservation (sets CANCELLED — the record is kept, never destroyed) */
  @Delete(':id')
  cancel(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.reservationsService.cancel(id, user);
  }
}
