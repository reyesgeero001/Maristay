import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Post()
  @ApiOperation({ summary: 'Record a payment (Front Desk, Manager) — Lab 05 #4. Simulated, no real money.' })
  @ApiResponse({ status: 201, description: 'Payment recorded; includes reservationStatus and billing summary' })
  @ApiResponse({ status: 400, description: 'Invalid payment information (amount, method, exceeds balance)' })
  @ApiResponse({ status: 403, description: 'Guests and housekeeping cannot record payments' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 409, description: 'Reservation is cancelled or checked out' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Get()
  @ApiOperation({ summary: 'List payments (guests: own only; Front Desk/Manager: all)' })
  @ApiResponse({ status: 200, description: 'Paginated payments' })
  findAll(@Query() query: PaymentQueryDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.findAll(query, user);
  }

  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'Get a payment (owner or Front Desk / Manager)' })
  @ApiResponse({ status: 200, description: 'Payment with its reservation' })
  @ApiResponse({ status: 403, description: "Another guest's payment" })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.paymentsService.findOne(id, user);
  }

  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Verify / update payment status: PENDING→PAID|FAILED, PAID→REFUNDED' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  @ApiResponse({ status: 400, description: 'Amount exceeds outstanding balance' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition or refund not allowed' })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.updateStatus(id, dto);
  }
}
