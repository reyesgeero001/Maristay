import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { globalRateLimit } from './auth/rate-limit.config';
import { RolesGuard } from './common/guards/roles.guard';
import { validateEnv } from './config/env.validation';
import { buildDataSourceOptions } from './database/database.config';
import { DigitalKeysModule } from './digital-keys/digital-keys.module';
import { GuestsModule } from './guests/guests.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { ReservationsModule } from './reservations/reservations.module';
import { RoomsModule } from './rooms/rooms.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { StaffModule } from './staff/staff.module';

@Module({
  imports: [
    // Loads .env and validates it at startup (fails fast on bad config).
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // MySQL connection via TypeORM + mysql2. Values come only from environment variables.
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...buildDataSourceOptions(process.env), autoLoadEntities: false }),
    }),
    // Default limit for every route; /auth/login has a stricter limit.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: () => globalRateLimit() }]),
    AuthModule,
    GuestsModule,
    RoomsModule,
    ReservationsModule,
    PaymentsModule,
    DigitalKeysModule,
    HousekeepingModule,
    StaffModule,
    ServiceOrdersModule,
    NotificationsModule,
  ],
  providers: [
    // Global guards run in this order for every request:
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // 1. rate limiting (429)
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // 2. authentication (401) unless @Public()
    { provide: APP_GUARD, useClass: RolesGuard }, // 3. role authorization (403) via @Roles()
  ],
})
export class AppModule {}
