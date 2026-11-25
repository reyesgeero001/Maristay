import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Housekeeping } from './entities/housekeeping.entity';
import { HousekeepingAssignmentService } from './housekeeping-assignment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Housekeeping])],
  providers: [HousekeepingAssignmentService],
  exports: [HousekeepingAssignmentService],
})
export class HousekeepingModule {}
