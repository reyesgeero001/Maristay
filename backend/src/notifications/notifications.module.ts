import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/** Simulated SMS / e-mail adapter shared by the workflow modules. */
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
