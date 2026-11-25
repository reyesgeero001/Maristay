import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { ServiceOrderQueryDto } from './dto/service-order-query.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ServiceOrdersService } from './service-orders.service';

@ApiTags('Service Orders')
@ApiBearerAuth()
@Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a food/amenity/service order (checked-in Guest) — Lab 05 #5' })
  @ApiResponse({ status: 201, description: 'PENDING order with server-calculated totalAmount' })
  @ApiResponse({ status: 400, description: 'Invalid order details (unknown itemCode, quantity)' })
  @ApiResponse({ status: 403, description: "Another guest's reservation" })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 409, description: 'Reservation is not checked in' })
  create(@Body() dto: CreateServiceOrderDto, @CurrentUser() user: AuthUser) {
    return this.serviceOrdersService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List service orders (guests: own only; Front Desk/Manager: all)' })
  @ApiResponse({ status: 200, description: 'Paginated orders' })
  findAll(@Query() query: ServiceOrderQueryDto, @CurrentUser() user: AuthUser) {
    return this.serviceOrdersService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service order (owner or Front Desk / Manager)' })
  @ApiResponse({ status: 200, description: 'Order with reservation and room' })
  @ApiResponse({ status: 403, description: "Another guest's order" })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.serviceOrdersService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order status (staff: PREPARING/DELIVERED/CANCELLED; guest: cancel PENDING)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 403, description: 'Guest tried anything other than cancelling a PENDING order' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateServiceOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceOrdersService.updateStatus(id, dto, user);
  }
}
