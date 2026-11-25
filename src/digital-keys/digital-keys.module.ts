import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalKey } from './entities/digital-key.entity';
import { DigitalKeyAccessService } from './digital-key-access.service';
import { DigitalKeysController } from './digital-keys.controller';
import { DigitalKeysService } from './digital-keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalKey])],
  controllers: [DigitalKeysController],
  providers: [DigitalKeysService, DigitalKeyAccessService],
  exports: [DigitalKeysService],
})
export class DigitalKeysModule {}
