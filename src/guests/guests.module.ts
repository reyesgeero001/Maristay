import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Guest } from './entities/guest.entity';
import { GuestsController } from './guests.controller';
import { GuestsService } from './guests.service';

@Module({
  imports: [TypeOrmModule.forFeature([Guest, Reservation]), AuthModule],
  controllers: [GuestsController],
  providers: [GuestsService],
})
export class GuestsModule {}
