import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Housekeeping } from './entities/housekeeping.entity';
import { HousekeepingAssignmentService } from './housekeeping-assignment.service';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingService } from './housekeeping.service';

@Module({
  imports: [TypeOrmModule.forFeature([Housekeeping])],
  controllers: [HousekeepingController],
  providers: [HousekeepingService, HousekeepingAssignmentService],
  exports: [HousekeepingAssignmentService],
})
export class HousekeepingModule {}
