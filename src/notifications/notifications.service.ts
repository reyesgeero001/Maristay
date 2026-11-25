import { Injectable, Logger } from '@nestjs/common';

export type NotificationChannel = 'SMS' | 'EMAIL';

export interface NotificationResult {
  channel: NotificationChannel;
  recipient: string; // masked
  status: 'SIMULATED_SENT';
  sentAt: string;
}

/**
 * SIMULATED external integration (Lab 03: "SMS / Email services").
 *
 * No real SMS gateway or mail server is contacted and no subscription or API
 * key is needed: messages are written to the application log and a delivery
 * receipt is returned. To connect a real provider later (e.g. an SMS API or
 * SMTP), replace the body of `deliver()` — callers do not need to change.
 *
 * Security: messages must never contain passwords, tokens or digital key codes,
 * and recipients are masked in logs and responses.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationService(SIMULATED)');

  sendSms(phoneNumber: string, message: string): NotificationResult {
    return this.deliver('SMS', phoneNumber, maskPhone(phoneNumber), message);
  }

  sendEmail(email: string, subject: string, message: string): NotificationResult {
    return this.deliver('EMAIL', email, maskEmail(email), `${subject} — ${message}`);
  }

  private deliver(channel: NotificationChannel, _to: string, masked: string, message: string): NotificationResult {
    this.logger.log(`[${channel}] to ${masked}: ${message}`);
    return { channel, recipient: masked, status: 'SIMULATED_SENT', sentAt: new Date().toISOString() };
  }
}

export function maskPhone(phone: string): string {
  return phone.length <= 4 ? '****' : `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 1)}***@${domain ?? ''}`;
}
