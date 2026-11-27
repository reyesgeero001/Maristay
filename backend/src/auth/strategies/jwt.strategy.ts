import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuthService, JwtPayload } from '../auth.service';

/**
 * Validates `Authorization: Bearer <token>`:
 *  1. passport-jwt checks the signature (HS256 + JWT_SECRET) and expiry;
 *  2. validate() re-loads the account from MySQL so a deactivated or deleted
 *     account is rejected immediately, even while its token is unexpired.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.authService.resolveActiveUser(payload);
    if (!user) throw new UnauthorizedException('Account is inactive or no longer exists');
    return user;
  }
}
