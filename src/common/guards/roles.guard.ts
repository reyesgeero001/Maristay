import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUser } from '../decorators/current-user.decorator';
import { Role } from '../enums';

/**
 * Role-based access control. Runs after JwtAuthGuard, so `request.user`
 * is already a verified, ACTIVE account. A valid token with the wrong role
 * receives 403 Forbidden (never 401).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    return true;
  }
}
