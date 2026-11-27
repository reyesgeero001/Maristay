import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountType, Role } from '../enums';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function contextFor(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);
  const manager = { id: 1, accountType: AccountType.STAFF, role: Role.MANAGER, email: 'm@maristay.test' };
  const guest = { id: 5, accountType: AccountType.GUEST, role: Role.GUEST, email: 'g@example.com' };

  const withMetadata = (meta: Record<string, unknown>) =>
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => meta[key as string]);

  afterEach(() => jest.restoreAllMocks());

  it('allows routes without @Roles()', () => {
    withMetadata({});
    expect(guard.canActivate(contextFor(guest))).toBe(true);
  });

  it('allows public routes', () => {
    withMetadata({ [IS_PUBLIC_KEY]: true, [ROLES_KEY]: [Role.MANAGER] });
    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    withMetadata({ [ROLES_KEY]: [Role.MANAGER] });
    expect(guard.canActivate(contextFor(manager))).toBe(true);
  });

  it('returns 403 (not 401) for an authenticated user with the wrong role', () => {
    withMetadata({ [ROLES_KEY]: [Role.MANAGER] });
    expect(() => guard.canActivate(contextFor(guest))).toThrow(ForbiddenException);
  });
});
