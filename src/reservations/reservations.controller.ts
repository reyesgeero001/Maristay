import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';
import { StayService } from './stay.service';

@ApiTags('Reservations')
@ApiBearerAuth()
@Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER) // Housekeeping has no access to reservations
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly stayService: StayService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Book a room (Guest; Front Desk/Manager on behalf of a guest) — Lab 05 #3' })
  @ApiResponse({ status: 201, description: 'PENDING reservation created with quoted totalAmount' })
  @ApiResponse({ status: 400, description: 'Invalid dates (past, reversed, > 30 nights) or body' })
  @ApiResponse({ status: 403, description: 'Guest tried to book for another guest' })
  @ApiResponse({ status: 404, description: 'Room or guest not found' })
  @ApiResponse({ status: 409, description: 'Room already booked for the selected dates / under maintenance' })
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: AuthUser) {
    return this.reservationsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List reservations (guests: own only; staff: all, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated reservations' })
  findAll(@Query() query: ReservationQueryDto, @CurrentUser() user: AuthUser) {
    return this.reservationsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one reservation (owner or Front Desk / Manager)' })
  @ApiResponse({ status: 200, description: 'Reservation with room and guest' })
  @ApiResponse({ status: 403, description: "Another guest's reservation" })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.reservationsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change room/dates of a PENDING or CONFIRMED reservation' })
  @ApiResponse({ status: 200, description: 'Reservation updated and total recalculated' })
  @ApiResponse({ status: 409, description: 'Overlapping booking or reservation no longer modifiable' })
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservationsService.update(id, dto, user);
  }

  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm a PENDING reservation (Front Desk, Manager)' })
  @ApiResponse({ status: 200, description: 'Reservation CONFIRMED' })
  @ApiResponse({ status: 409, description: 'Reservation is not PENDING' })
  confirm(@Param('id', ParseIdPipe) id: number) {
    return this.reservationsService.confirm(id);
  }

  @Patch(':id/check-in')
  @ApiOperation({
    summary: 'Digital check-in (owner or Front Desk/Manager) — issues a digital room key',
  })
  @ApiResponse({ status: 200, description: 'CHECKED_IN, room OCCUPIED, digital key returned once' })
  @ApiResponse({ status: 403, description: "Another guest's reservation" })
  @ApiResponse({
    status: 409,
    description: 'Not confirmed, not yet check-in date, unpaid balance, or room not ready',
  })
  checkIn(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.stayService.checkIn(id, user);
  }

  @Patch(':id/check-out')
  @ApiOperation({
    summary: 'Digital check-out (owner or Front Desk/Manager) — revokes keys, queues cleaning',
  })
  @ApiResponse({ status: 200, description: 'CHECKED_OUT, keys revoked, room CLEANING, housekeeping task' })
  @ApiResponse({ status: 409, description: 'Not checked in, or outstanding balance' })
  checkOut(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.stayService.checkOut(id, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Cancel a reservation (sets CANCELLED — the record is kept, never destroyed)',
  })
  @ApiResponse({ status: 200, description: 'Reservation CANCELLED' })
  @ApiResponse({ status: 409, description: 'Already checked in/out or cancelled' })
  cancel(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.reservationsService.cancel(id, user);
  }
}
