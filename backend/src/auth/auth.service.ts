import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { BCRYPT_ROUNDS } from '../common/utilities/security.util';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { AccountStatus, AccountType, Role } from '../common/enums';
import { Guest } from '../guests/entities/guest.entity';
import { Staff } from '../staff/entities/staff.entity';
import { LoginDto } from './dto/login.dto';

/** Claims stored inside the signed access token. */
export interface JwtPayload {
  sub: number;
  accountType: AccountType;
  role: Role;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: number;
    accountType: AccountType;
    role: Role;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * A real bcrypt hash of a random value. Comparing against it when the email is
 * unknown makes "unknown email" and "wrong password" take the same time, so
 * response timing does not reveal which emails are registered.
 */
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Guest) private readonly guests: Repository<Guest>,
    @InjectRepository(Staff) private readonly staff: Repository<Staff>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Lab 06 login flow: find account -> verify bcrypt hash -> verify account
   * status -> issue JWT containing the user id, account type and role.
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const email = dto.email.trim().toLowerCase();
    // passwordHash is `select: false`, so it must be requested explicitly.
    const staff = await this.staff
      .createQueryBuilder('s')
      .addSelect('s.passwordHash')
      .where('s.email = :email', { email })
      .getOne();
    const guest = staff
      ? null
      : await this.guests
          .createQueryBuilder('g')
          .addSelect('g.passwordHash')
          .where('g.email = :email', { email })
          .getOne();

    const account = staff ?? guest;
    const passwordMatches = await bcrypt.compare(dto.password, account?.passwordHash ?? DUMMY_HASH);

    // Same message for unknown email, wrong password and inactive account.
    if (!account || !passwordMatches || account.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = staff
      ? { sub: staff.staffId, accountType: AccountType.STAFF, role: staff.role as unknown as Role, email }
      : { sub: guest!.guestId, accountType: AccountType.GUEST, role: Role.GUEST, email };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '1h',
      user: {
        id: payload.sub,
        accountType: payload.accountType,
        role: payload.role,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
      },
    };
  }

  /** Called on every authenticated request by JwtStrategy. */
  async resolveActiveUser(payload: JwtPayload): Promise<AuthUser | null> {
    if (!payload || typeof payload.sub !== 'number') return null;

    if (payload.accountType === AccountType.STAFF) {
      const staff = await this.staff.findOneBy({ staffId: payload.sub });
      if (!staff || staff.accountStatus !== AccountStatus.ACTIVE) return null;
      // Use the role from the database, so a role change takes effect immediately.
      return { id: staff.staffId, accountType: AccountType.STAFF, role: staff.role as unknown as Role, email: staff.email };
    }
    if (payload.accountType === AccountType.GUEST) {
      const guest = await this.guests.findOneBy({ guestId: payload.sub });
      if (!guest || guest.accountStatus !== AccountStatus.ACTIVE) return null;
      return { id: guest.guestId, accountType: AccountType.GUEST, role: Role.GUEST, email: guest.email };
    }
    return null;
  }

  /** Profile of the currently authenticated user (GET /auth/me). */
  async getProfile(user: AuthUser): Promise<{ accountType: AccountType; role: Role; profile: Guest | Staff }> {
    const profile =
      user.accountType === AccountType.STAFF
        ? await this.staff.findOneByOrFail({ staffId: user.id })
        : await this.guests.findOneByOrFail({ guestId: user.id });
    return { accountType: user.accountType, role: user.role, profile };
  }
}
