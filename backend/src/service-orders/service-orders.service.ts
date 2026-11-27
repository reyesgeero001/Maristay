import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, Paginated } from '../common/dto/pagination-query.dto';
import { ReservationStatus, ServiceOrderStatus } from '../common/enums';
import { fromCents, toCents } from '../common/utilities/money.util';
import { assertGuestOwnerOrStaff, isGuest } from '../common/utilities/ownership.util';
import { NotificationsService } from '../notifications/notifications.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { ServiceOrderQueryDto } from './dto/service-order-query.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ServiceOrder } from './entities/service-order.entity';
import { SERVICE_CATALOG } from './service-catalog';

const ORDER_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  [ServiceOrderStatus.PENDING]: [ServiceOrderStatus.PREPARING, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.PREPARING]: [ServiceOrderStatus.DELIVERED, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.DELIVERED]: [],
  [ServiceOrderStatus.CANCELLED]: [],
};

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrder) private readonly orders: Repository<ServiceOrder>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Step 8 — Service ordering. The guest must own the reservation and be
   * CHECKED_IN. Price comes from the server-side catalog, never the client.
   */
  async create(dto: CreateServiceOrderDto, user: AuthUser): Promise<ServiceOrder> {
    const orderId = await this.dataSource.transaction(async (em) => {
      // Locking the reservation serializes this with a concurrent check-out,
      // so no order can slip in after the guest has checked out.
      const reservation = await em.findOne(Reservation, {
        where: { reservationId: dto.reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');
      assertGuestOwnerOrStaff(user, reservation.guestId);
      if (reservation.reservationStatus !== ReservationStatus.CHECKED_IN) {
        throw new ConflictException('Service orders can only be placed for checked-in reservations');
      }

      const item = SERVICE_CATALOG[dto.itemCode];
      const order = em.create(ServiceOrder, {
        reservationId: reservation.reservationId,
        serviceType: item.serviceType,
        itemCode: dto.itemCode,
        quantity: dto.quantity,
        unitPrice: item.unitPrice,
        totalAmount: fromCents(toCents(item.unitPrice) * dto.quantity),
        status: ServiceOrderStatus.PENDING,
        date: new Date(),
        notes: dto.notes ?? null,
      });
      return (await em.save(order)).orderId;
    });
    return this.findById(orderId);
  }

  async findAll(query: ServiceOrderQueryDto, user: AuthUser): Promise<Paginated<ServiceOrder>> {
    const qb = this.orders
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.reservation', 'r')
      .leftJoinAndSelect('r.room', 'room')
      .orderBy('o.orderId', 'DESC');
    if (isGuest(user)) qb.andWhere('r.guestId = :ownId', { ownId: user.id });
    if (query.status) qb.andWhere('o.status = :status', { status: query.status });
    if (query.serviceType) qb.andWhere('o.serviceType = :type', { type: query.serviceType });
    if (query.reservationId) qb.andWhere('o.reservationId = :rid', { rid: query.reservationId });
    const [data, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(orderId: number, user: AuthUser): Promise<ServiceOrder> {
    const order = await this.findById(orderId);
    assertGuestOwnerOrStaff(user, order.reservation!.guestId);
    return order;
  }

  async updateStatus(orderId: number, dto: UpdateServiceOrderDto, user: AuthUser): Promise<ServiceOrder> {
    await this.dataSource.transaction(async (em) => {
      const order = await em.findOne(ServiceOrder, { where: { orderId }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new NotFoundException('Service order not found');
      const reservation = await em.findOneByOrFail(Reservation, { reservationId: order.reservationId });
      assertGuestOwnerOrStaff(user, reservation.guestId);

      if (isGuest(user) && !(order.status === ServiceOrderStatus.PENDING && dto.status === ServiceOrderStatus.CANCELLED)) {
        throw new ForbiddenException('Guests can only cancel their own PENDING orders');
      }
      if (order.status === dto.status) return;
      if (!ORDER_TRANSITIONS[order.status].includes(dto.status)) {
        throw new ConflictException(`Invalid status transition: ${order.status} → ${dto.status}`);
      }
      await em.update(ServiceOrder, { orderId }, { status: dto.status });
    });

    const updated = await this.findById(orderId);
    if (updated.status === ServiceOrderStatus.DELIVERED) {
      const guest = updated.reservation!.guest!;
      this.notifications.sendSms(
        guest.phoneNumber,
        `Your ${SERVICE_CATALOG[updated.itemCode]?.name ?? updated.serviceType} order #${updated.orderId} has been delivered to room ${updated.reservation!.room!.roomNo}.`,
      );
    }
    return updated;
  }

  private async findById(orderId: number): Promise<ServiceOrder> {
    const order = await this.orders.findOne({
      where: { orderId },
      relations: { reservation: { room: true, guest: true } },
    });
    if (!order) throw new NotFoundException('Service order not found');
    return order;
  }
}
