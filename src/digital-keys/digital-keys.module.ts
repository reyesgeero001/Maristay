import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalKey } from './entities/digital-key.entity';
import { DigitalKeysService } from './digital-keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalKey])],
  providers: [DigitalKeysService],
  exports: [DigitalKeysService],
})
export class DigitalKeysModule {}
