import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { loginRateLimit } from './rate-limit.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Log in as a guest or staff member and receive a JWT access token */
  @Public()
  @Throttle({ default: loginRateLimit() })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Get the profile of the currently authenticated user */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user);
  }
}
