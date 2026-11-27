import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { ServiceOrderQueryDto } from './dto/service-order-query.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ServiceOrdersService } from './service-orders.service';

@Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  /** Place a food/amenity/service order (checked-in Guest) — Lab 05 #5 */
  @Post()
  create(@Body() dto: CreateServiceOrderDto, @CurrentUser() user: AuthUser) {
    return this.serviceOrdersService.create(dto, user);
  }

  /** List service orders (guests: own only; Front Desk/Manager: all) */
  @Get()
  findAll(@Query() query: ServiceOrderQueryDto, @CurrentUser() user: AuthUser) {
    return this.serviceOrdersService.findAll(query, user);
  }

  /** Get a service order (owner or Front Desk / Manager) */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.serviceOrdersService.findOne(id, user);
  }

  /** Update order status (staff: PREPARING/DELIVERED/CANCELLED; guest: cancel PENDING) */
  @Patch(':id')
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateServiceOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceOrdersService.updateStatus(id, dto, user);
  }
}
