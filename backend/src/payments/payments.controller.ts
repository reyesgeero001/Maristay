import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Record a payment (Front Desk, Manager) — Lab 05 #4. Simulated, no real money. */
  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  /** List payments (guests: own only; Front Desk/Manager: all) */
  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Get()
  findAll(@Query() query: PaymentQueryDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.findAll(query, user);
  }

  /** Get a payment (owner or Front Desk / Manager) */
  @Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.paymentsService.findOne(id, user);
  }

  /** Verify / update payment status: PENDING→PAID|FAILED, PAID→REFUNDED */
  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.updateStatus(id, dto);
  }
}
