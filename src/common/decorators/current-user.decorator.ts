import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccountType, Role } from '../enums';

/** Shape of `request.user` after the JWT strategy has validated the token. */
export interface AuthUser {
  id: number;
  accountType: AccountType;
  role: Role;
  email: string;
}

/** Injects the authenticated user into a controller method parameter. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
