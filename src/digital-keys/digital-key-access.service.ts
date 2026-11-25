import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, Paginated } from '../common/dto/pagination-query.dto';
import { DigitalKeyStatus, ReservationStatus } from '../common/enums';
import { checkOutDeadline } from '../common/utilities/date.util';
import { assertGuestOwnerOrStaff, isGuest } from '../common/utilities/ownership.util';
import { hashDigitalKeyCode } from '../common/utilities/security.util';
import { Reservation } from '../reservations/entities/reservation.entity';
import { DigitalKeysService, IssuedKey } from './digital-keys.service';
import { CreateDigitalKeyDto } from './dto/create-digital-key.dto';
import { DigitalKeyQueryDto } from './dto/digital-key-query.dto';
import { ValidateDigitalKeyDto } from './dto/validate-digital-key.dto';
import { DigitalKey } from './entities/digital-key.entity';

export interface AccessDecision {
  accessGranted: true;
  keyId: number;
  reservationId: number;
  roomId: number;
  roomNo: string;
  expiresAt: Date;
  message: string;
}

/** API-facing digital key operations (issue/reissue, view, validate, revoke). */
@Injectable()
export class DigitalKeyAccessService {
  constructor(
    @InjectRepository(DigitalKey) private readonly keys: Repository<DigitalKey>,
    private readonly digitalKeys: DigitalKeysService,
    private readonly dataSource: DataSource,
  ) {}

  async issue(dto: CreateDigitalKeyDto, user: AuthUser): Promise<IssuedKey> {
    if (dto.expiresAt && isGuest(user)) {
      throw new ForbiddenException('Only staff can set a custom key expiry');
    }
    return this.dataSource.transaction(async (em) => {
      const reservation = await em.findOne(Reservation, {
        where: { reservationId: dto.reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');
      assertGuestOwnerOrStaff(user, reservation.guestId);
      if (reservation.reservationStatus !== ReservationStatus.CHECKED_IN) {
        throw new ConflictException('Digital keys can only be issued for checked-in reservations');
      }
      if (dto.expiresAt) {
        const deadline = checkOutDeadline(reservation.checkOutDate);
        if (dto.expiresAt.getTime() <= Date.now()) throw new BadRequestException('expiresAt must be in the future');
        if (dto.expiresAt > deadline) {
          throw new BadRequestException(`expiresAt cannot be later than the check-out deadline (${deadline.toISOString()})`);
        }
      }
      return this.digitalKeys.issueKey(em, reservation, dto.expiresAt);
    });
  }

  async findAll(query: DigitalKeyQueryDto, user: AuthUser): Promise<Paginated<DigitalKey>> {
    await this.expireStaleKeys();
    const qb = this.keys.createQueryBuilder('k').innerJoin('k.reservation', 'r').orderBy('k.keyId', 'DESC');
    if (isGuest(user)) qb.andWhere('r.guestId = :ownId', { ownId: user.id });
    if (query.reservationId) qb.andWhere('k.reservationId = :rid', { rid: query.reservationId });
    if (query.status) qb.andWhere('k.status = :status', { status: query.status });
    const [data, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  /** Key metadata only — the credential itself can never be retrieved again. */
  async findOne(keyId: number, user: AuthUser): Promise<DigitalKey> {
    await this.expireStaleKeys();
    const key = await this.keys.findOne({ where: { keyId }, relations: { reservation: { room: true } } });
    if (!key) throw new NotFoundException('Digital key not found');
    assertGuestOwnerOrStaff(user, key.reservation!.guestId);
    return key;
  }

  /**
   * Step 7 — Digital room access (SIMULATED smart lock).
   * The submitted code is hashed and looked up; access is granted only if the
   * key is ACTIVE, unexpired, belongs to a CHECKED_IN reservation for this
   * exact room, and the caller owns it (or is operations staff).
   * No physical lock is opened — this only returns the decision.
   */
  async validate(dto: ValidateDigitalKeyDto, user: AuthUser): Promise<AccessDecision> {
    const key = await this.keys.findOne({
      where: { keyCodeHash: hashDigitalKeyCode(dto.keyCode) },
      relations: { reservation: { room: true } },
    });
    if (!key) throw new ForbiddenException('Access denied: invalid digital key');
    assertGuestOwnerOrStaff(user, key.reservation!.guestId);

    if (key.status === DigitalKeyStatus.REVOKED) throw new ForbiddenException('Access denied: digital key has been revoked');
    if (key.status === DigitalKeyStatus.EXPIRED || key.expiresAt.getTime() <= Date.now()) {
      if (key.status === DigitalKeyStatus.ACTIVE) {
        await this.keys.update({ keyId: key.keyId }, { status: DigitalKeyStatus.EXPIRED });
      }
      throw new ForbiddenException('Access denied: digital key has expired');
    }
    if (key.reservation!.reservationStatus !== ReservationStatus.CHECKED_IN) {
      throw new ForbiddenException('Access denied: reservation is not checked in');
    }
    if (key.reservation!.roomId !== dto.roomId) {
      throw new ForbiddenException('Access denied: digital key is not valid for this room');
    }

    return {
      accessGranted: true,
      keyId: key.keyId,
      reservationId: key.reservationId,
      roomId: key.reservation!.roomId,
      roomNo: key.reservation!.room!.roomNo,
      expiresAt: key.expiresAt,
      message: 'Access granted (simulated smart lock — no physical door is opened)',
    };
  }

  async revoke(keyId: number): Promise<DigitalKey> {
    const key = await this.keys.findOneBy({ keyId });
    if (!key) throw new NotFoundException('Digital key not found');
    if (key.status !== DigitalKeyStatus.ACTIVE) {
      throw new ConflictException(`Only ACTIVE keys can be revoked (current: ${key.status})`);
    }
    await this.keys.update({ keyId }, { status: DigitalKeyStatus.REVOKED });
    return this.keys.findOneByOrFail({ keyId });
  }

  /** Marks ACTIVE keys whose expiry has passed as EXPIRED (keeps listings accurate). */
  private async expireStaleKeys(): Promise<void> {
    await this.keys.update(
      { status: DigitalKeyStatus.ACTIVE, expiresAt: LessThanOrEqual(new Date()) },
      { status: DigitalKeyStatus.EXPIRED },
    );
  }
}
