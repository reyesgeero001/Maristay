import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalKeysModule } from '../digital-keys/digital-keys.module';
import { HousekeepingModule } from '../housekeeping/housekeeping.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { Reservation } from './entities/reservation.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { StayService } from './stay.service';

/**
 * Reservations orchestrate the guest stay, so this module imports the services
 * it integrates with. None of those modules import Reservations back, which
 * keeps the dependency graph free of cycles.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    PaymentsModule,
    DigitalKeysModule,
    HousekeepingModule,
    NotificationsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, StayService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
