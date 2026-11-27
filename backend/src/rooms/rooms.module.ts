import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Housekeeping } from '../housekeeping/entities/housekeeping.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Room } from './entities/room.entity';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Reservation, Housekeeping])],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
