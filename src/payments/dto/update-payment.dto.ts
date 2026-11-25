import { IsEnum } from 'class-validator';
import { PaymentStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';

/**
 * PATCH /payments/:id — payment verification.
 * Allowed transitions: PENDING → PAID | FAILED, PAID → REFUNDED.
 * Amount, method and reservation are immutable once recorded (audit trail).
 */
export class UpdatePaymentDto {
  /** @example PAID */
  @ToUpperCase()
  @IsEnum(PaymentStatus, { message: 'status must be one of: PENDING, PAID, FAILED, REFUNDED' })
  status!: PaymentStatus;
}
