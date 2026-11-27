import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { IdentityService } from '../auth/identity.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, Paginated, PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AccountStatus, ACTIVE_RESERVATION_STATUSES, Role } from '../common/enums';
import { assertGuestOwnerOrStaff, isGuest } from '../common/utilities/ownership.util';
import { BCRYPT_ROUNDS } from '../common/utilities/security.util';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateGuestDto } from './dto/create-guest.dto';
import { GuestQueryDto } from './dto/guest-query.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { Guest } from './entities/guest.entity';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest) private readonly guests: Repository<Guest>,
    @InjectRepository(Reservation) private readonly reservations: Repository<Reservation>,
    private readonly identity: IdentityService,
  ) {}

  /** Step 1 — Guest registration: validate, check email, hash password, save. */
  async register(dto: CreateGuestDto): Promise<Guest> {
    await this.identity.assertEmailAvailable(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Fields are copied explicitly (no spreading of client input) to prevent
    // mass assignment of accountStatus or other server-controlled columns.
    const guest = this.guests.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
    });
    const saved = await this.guests.save(guest);
    return this.guests.findOneByOrFail({ guestId: saved.guestId }); // reload without passwordHash
  }

  async findAll(query: GuestQueryDto): Promise<Paginated<Guest>> {
    const qb = this.guests.createQueryBuilder('g').orderBy('g.guestId', 'ASC');
    if (query.search) {
      // Parameter binding (:search) — user input is never concatenated into SQL.
      qb.andWhere('(g.firstName LIKE :search OR g.lastName LIKE :search OR g.email LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.accountStatus) qb.andWhere('g.accountStatus = :status', { status: query.accountStatus });
    const [data, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(guestId: number, user: AuthUser): Promise<Guest> {
    assertGuestOwnerOrStaff(user, guestId);
    const guest = await this.guests.findOneBy({ guestId });
    if (!guest) throw new NotFoundException('Guest not found');
    return guest;
  }

  async update(guestId: number, dto: UpdateGuestDto, user: AuthUser): Promise<Guest> {
    assertGuestOwnerOrStaff(user, guestId);
    const guest = await this.guests
      .createQueryBuilder('g')
      .addSelect('g.passwordHash')
      .where('g.guestId = :guestId', { guestId })
      .getOne();
    if (!guest) throw new NotFoundException('Guest not found');

    if (dto.accountStatus !== undefined && user.role !== Role.MANAGER) {
      throw new ForbiddenException('Only a manager can change the account status');
    }
    if (dto.newPassword !== undefined) {
      if (!isGuest(user)) throw new ForbiddenException('Only the account owner can change the password');
      const ok = await bcrypt.compare(dto.currentPassword ?? '', guest.passwordHash);
      if (!ok) throw new UnauthorizedException('Current password is incorrect');
      guest.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    }
    if (dto.email !== undefined && dto.email !== guest.email) {
      await this.identity.assertEmailAvailable(dto.email, { guestId });
      guest.email = dto.email;
    }
    if (dto.firstName !== undefined) guest.firstName = dto.firstName;
    if (dto.lastName !== undefined) guest.lastName = dto.lastName;
    if (dto.phoneNumber !== undefined) guest.phoneNumber = dto.phoneNumber;
    if (dto.accountStatus !== undefined) guest.accountStatus = dto.accountStatus;

    await this.guests.save(guest);
    return this.guests.findOneByOrFail({ guestId });
  }

  /**
   * DELETE /guests/:id — deactivates the account instead of deleting it, so
   * reservation and payment history stays intact. Blocked while the guest
   * still has an active (pending/confirmed/checked-in) reservation.
   */
  async deactivate(guestId: number, user: AuthUser): Promise<void> {
    assertGuestOwnerOrStaff(user, guestId, [Role.MANAGER]);
    const guest = await this.guests.findOneBy({ guestId });
    if (!guest) throw new NotFoundException('Guest not found');
    if (guest.accountStatus === AccountStatus.INACTIVE) return;

    const active = await this.reservations.countBy({
      guestId,
      reservationStatus: In(ACTIVE_RESERVATION_STATUSES),
    });
    if (active > 0) {
      throw new ConflictException('Guest has active reservations; cancel or complete them first');
    }
    await this.guests.update({ guestId }, { accountStatus: AccountStatus.INACTIVE });
  }

  /** GET /guests/:id/reservations — Lab 05 nested resource (reservation history). */
  async findReservations(guestId: number, user: AuthUser, query: PaginationQueryDto): Promise<Paginated<Reservation>> {
    assertGuestOwnerOrStaff(user, guestId);
    if (!(await this.guests.existsBy({ guestId }))) throw new NotFoundException('Guest not found');
    const [data, total] = await this.reservations.findAndCount({
      where: { guestId },
      relations: { room: true },
      order: { checkInDate: 'DESC', reservationId: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return paginate(data, total, query.page, query.limit);
  }
}
