import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { loginRateLimit } from './rate-limit.config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: loginRateLimit() })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in as a guest or staff member and receive a JWT access token' })
  @ApiResponse({ status: 200, description: 'Login successful — returns accessToken and safe user info' })
  @ApiResponse({ status: 400, description: 'Validation failed (e.g. malformed email)' })
  @ApiResponse({ status: 401, description: 'Invalid email or password, or inactive account' })
  @ApiResponse({ status: 429, description: 'Too many login attempts — try again later' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  @ApiResponse({ status: 401, description: 'Missing, invalid or expired token' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user);
  }
}
