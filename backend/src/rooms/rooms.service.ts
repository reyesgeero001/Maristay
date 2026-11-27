import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Paginated } from '../common/dto/pagination-query.dto';
import { ACTIVE_RESERVATION_STATUSES, RoomStatus } from '../common/enums';
import { Housekeeping } from '../housekeeping/entities/housekeeping.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { ReplaceRoomDto } from './dto/replace-room.dto';
import { RoomQueryDto } from './dto/room-query.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(Reservation) private readonly reservations: Repository<Reservation>,
    @InjectRepository(Housekeeping) private readonly housekeeping: Repository<Housekeeping>,
  ) {}

  /** Step 3 — Room selection: filter by status, type, price and booking dates. */
  async findAll(query: RoomQueryDto): Promise<Paginated<Room>> {
    if ((query.checkInDate === undefined) !== (query.checkOutDate === undefined)) {
      throw new BadRequestException('checkInDate and checkOutDate must be provided together');
    }
    if (query.checkInDate && query.checkOutDate && query.checkOutDate <= query.checkInDate) {
      throw new BadRequestException('checkOutDate must be later than checkInDate');
    }
    if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const qb = this.rooms.createQueryBuilder('room').orderBy('room.roomNo', 'ASC');
    if (query.roomStatus) qb.andWhere('room.roomStatus = :roomStatus', { roomStatus: query.roomStatus });
    if (query.roomType) qb.andWhere('room.roomType = :roomType', { roomType: query.roomType });
    if (query.minPrice !== undefined) qb.andWhere('room.pricePerNight >= :minPrice', { minPrice: query.minPrice });
    if (query.maxPrice !== undefined) qb.andWhere('room.pricePerNight <= :maxPrice', { maxPrice: query.maxPrice });

    if (query.checkInDate && query.checkOutDate) {
      // Date-range availability is decided by reservations, NOT by roomStatus.
      // Half-open overlap test: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
      qb.andWhere('room.roomStatus <> :maintenance', { maintenance: RoomStatus.MAINTENANCE }).andWhere(
        `NOT EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.roomId = room.roomId
            AND r.reservationStatus IN (:...active)
            AND r.checkInDate < :checkOutDate
            AND r.checkOutDate > :checkInDate
        )`,
        {
          active: ACTIVE_RESERVATION_STATUSES,
          checkInDate: query.checkInDate,
          checkOutDate: query.checkOutDate,
        },
      );
    }

    const [data, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(roomId: number): Promise<Room> {
    const room = await this.rooms.findOneBy({ roomId });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async create(dto: CreateRoomDto): Promise<Room> {
    await this.assertRoomNoAvailable(dto.roomNo);
    const room = this.rooms.create({
      roomNo: dto.roomNo,
      roomType: dto.roomType,
      pricePerNight: dto.pricePerNight,
      roomStatus: dto.roomStatus ?? RoomStatus.AVAILABLE,
    });
    return this.rooms.save(room);
  }

  /** PATCH — only the provided fields change. */
  async update(roomId: number, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(roomId);
    return this.applyChanges(room, dto);
  }

  /** PUT — every mutable field is replaced (all are required by ReplaceRoomDto). */
  async replace(roomId: number, dto: ReplaceRoomDto): Promise<Room> {
    const room = await this.findOne(roomId);
    return this.applyChanges(room, dto);
  }

  /**
   * Hard delete is allowed only for rooms with no history. Rooms referenced by
   * reservations or housekeeping records must be kept (set MAINTENANCE instead),
   * which the RESTRICT foreign keys would also enforce.
   */
  async remove(roomId: number): Promise<void> {
    await this.findOne(roomId);
    const hasReservations = await this.reservations.existsBy({ roomId });
    const hasHousekeeping = await this.housekeeping.existsBy({ roomId });
    if (hasReservations || hasHousekeeping) {
      throw new ConflictException(
        'Room has reservation or housekeeping history and cannot be deleted; set its status to MAINTENANCE instead',
      );
    }
    await this.rooms.delete({ roomId });
  }

  private async applyChanges(room: Room, dto: UpdateRoomDto): Promise<Room> {
    if (dto.roomNo !== undefined && dto.roomNo !== room.roomNo) {
      await this.assertRoomNoAvailable(dto.roomNo);
      room.roomNo = dto.roomNo;
    }
    if (dto.roomStatus !== undefined && dto.roomStatus !== room.roomStatus) {
      if (room.roomStatus === RoomStatus.OCCUPIED) {
        throw new ConflictException('Room is occupied by a checked-in guest; its status changes at check-out');
      }
      room.roomStatus = dto.roomStatus;
    }
    if (dto.roomType !== undefined) room.roomType = dto.roomType;
    // Existing reservations keep their own rate snapshot, so price changes are safe.
    if (dto.pricePerNight !== undefined) room.pricePerNight = dto.pricePerNight;
    return this.rooms.save(room);
  }

  private async assertRoomNoAvailable(roomNo: string): Promise<void> {
    if (await this.rooms.existsBy({ roomNo })) {
      throw new ConflictException(`Room number ${roomNo} already exists`);
    }
  }
}
