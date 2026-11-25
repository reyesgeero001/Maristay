import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Housekeeping } from '../housekeeping/entities/housekeeping.entity';
import { Staff } from './entities/staff.entity';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [TypeOrmModule.forFeature([Staff, Housekeeping]), AuthModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
