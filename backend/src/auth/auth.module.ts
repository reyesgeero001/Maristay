import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from '../guests/entities/guest.entity';
import { Staff } from '../staff/entities/staff.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IdentityService } from './identity.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest, Staff]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.get('JWT_EXPIRES_IN') ?? '1h',
          issuer: 'maristay-api',
        },
        verifyOptions: { algorithms: ['HS256'], issuer: 'maristay-api' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, IdentityService, JwtStrategy],
  exports: [IdentityService],
})
export class AuthModule {}
