import { IsEnum, IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';

/** Statuses allowed when a payment is first recorded (REFUNDED only via PATCH). */
export const INITIAL_PAYMENT_STATUSES = [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED];

/**
 * POST /payments (Lab 05 #4) — Front Desk records a payment.
 * Prototype only: no card numbers or e-wallet credentials are accepted.
 */
export class CreatePaymentDto {
  /** @example 1 */
  @IsInt()
  @Min(1)
  reservationId!: number;

  /** Amount in PHP, greater than 0, max 2 decimals. @example 5000 */
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(10_000_000)
  amount!: number;

  /** CASH, CARD or E_WALLET (case-insensitive). @example CASH */
  @ToUpperCase()
  @IsEnum(PaymentMethod, { message: 'paymentMethod must be one of: CASH, CARD, E_WALLET' })
  paymentMethod!: PaymentMethod;

  /** Defaults to PAID. @example PAID */
  @IsOptional()
  @ToUpperCase()
  @IsIn(INITIAL_PAYMENT_STATUSES, { message: 'status must be one of: PENDING, PAID, FAILED' })
  status?: PaymentStatus;
}
