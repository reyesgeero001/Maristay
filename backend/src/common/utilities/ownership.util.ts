import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../decorators/current-user.decorator';
import { AccountType, OPERATIONS_ROLES, Role } from '../enums';

export const isGuest = (user: AuthUser) => user.accountType === AccountType.GUEST;
export const isOperationsStaff = (user: AuthUser) => OPERATIONS_ROLES.includes(user.role);

/**
 * Ownership verification (Lab 06 "check role/ownership"):
 * a guest may only touch records that belong to their own guestId; staff
 * may proceed only if their role is in `allowedStaffRoles`.
 * Returns 403 Forbidden otherwise.
 */
export function assertGuestOwnerOrStaff(
  user: AuthUser,
  ownerGuestId: number,
  allowedStaffRoles: Role[] = OPERATIONS_ROLES,
): void {
  if (isGuest(user)) {
    if (user.id !== ownerGuestId) {
      throw new ForbiddenException('You can only access your own records');
    }
    return;
  }
  if (!allowedStaffRoles.includes(user.role)) {
    throw new ForbiddenException('You do not have permission to perform this action');
  }
}
