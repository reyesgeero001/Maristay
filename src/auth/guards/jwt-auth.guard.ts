import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * Global authentication guard: every route requires a valid JWT unless it is
 * marked with @Public(). Missing, malformed, expired or forged tokens -> 401.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: unknown, user: TUser, info: unknown): TUser {
    if (err instanceof UnauthorizedException) throw err;
    if (err || !user) {
      const reason = info instanceof Error && info.name === 'TokenExpiredError' ? 'Access token has expired' : 'Invalid or missing access token';
      throw new UnauthorizedException(reason);
    }
    return user;
  }
}
