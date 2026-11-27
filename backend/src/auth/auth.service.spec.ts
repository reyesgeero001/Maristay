import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ObjectLiteral, Repository } from 'typeorm';
import { AccountStatus, AccountType, Role, StaffRole } from '../common/enums';
import { Guest } from '../guests/entities/guest.entity';
import { Staff } from '../staff/entities/staff.entity';
import { AuthService } from './auth.service';

/** Minimal query-builder mock returning a fixed entity from getOne(). */
function repoReturning<T extends ObjectLiteral>(entity: T | null) {
  const qb = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(entity),
  };
  return {
    createQueryBuilder: jest.fn(() => qb),
    findOneBy: jest.fn().mockResolvedValue(entity),
  } as unknown as Repository<T>;
}

describe('AuthService', () => {
  const password = 'CorrectHorse1';
  let passwordHash: string;
  const jwt = new JwtService({ secret: 'unit-test-secret-that-is-long-enough-123', signOptions: { expiresIn: '1h' } });
  const config = { get: () => '1h' } as unknown as ConfigService;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 4); // low cost: unit test speed only
  });

  const guest = (overrides: Partial<Guest> = {}): Guest =>
    ({
      guestId: 10,
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan@example.com',
      phoneNumber: '09170000001',
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      ...overrides,
    }) as Guest;

  it('issues a JWT containing id, account type and role for a valid guest', async () => {
    const service = new AuthService(repoReturning<Guest>(guest()), repoReturning<Staff>(null), jwt, config);
    const result = await service.login({ email: 'juan@example.com', password });

    expect(result.tokenType).toBe('Bearer');
    expect(result.user).toMatchObject({ id: 10, accountType: AccountType.GUEST, role: Role.GUEST });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    const payload = jwt.verify(result.accessToken);
    expect(payload).toMatchObject({ sub: 10, accountType: 'GUEST', role: 'GUEST' });
  });

  it('logs staff in with their staff role', async () => {
    const staff = { staffId: 1, firstName: 'M', lastName: 'V', email: 'm@maristay.test', role: StaffRole.MANAGER, passwordHash, accountStatus: AccountStatus.ACTIVE } as Staff;
    const service = new AuthService(repoReturning<Guest>(null), repoReturning<Staff>(staff), jwt, config);
    const result = await service.login({ email: 'm@maristay.test', password });
    expect(result.user).toMatchObject({ id: 1, accountType: AccountType.STAFF, role: Role.MANAGER });
  });

  it('rejects a wrong password with 401', async () => {
    const service = new AuthService(repoReturning<Guest>(guest()), repoReturning<Staff>(null), jwt, config);
    await expect(service.login({ email: 'juan@example.com', password: 'WrongPass1' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unknown email with the same 401 message', async () => {
    const service = new AuthService(repoReturning<Guest>(null), repoReturning<Staff>(null), jwt, config);
    await expect(service.login({ email: 'nobody@example.com', password })).rejects.toThrow('Invalid email or password');
  });

  it('rejects an INACTIVE account even with the right password', async () => {
    const service = new AuthService(
      repoReturning<Guest>(guest({ accountStatus: AccountStatus.INACTIVE })),
      repoReturning<Staff>(null),
      jwt,
      config,
    );
    await expect(service.login({ email: 'juan@example.com', password })).rejects.toThrow(UnauthorizedException);
  });

  it('resolveActiveUser returns null for a deactivated account (token stops working)', async () => {
    const service = new AuthService(
      repoReturning<Guest>(guest({ accountStatus: AccountStatus.INACTIVE })),
      repoReturning<Staff>(null),
      jwt,
      config,
    );
    await expect(
      service.resolveActiveUser({ sub: 10, accountType: AccountType.GUEST, role: Role.GUEST, email: 'juan@example.com' }),
    ).resolves.toBeNull();
  });
});
