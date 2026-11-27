import { IsEnum } from 'class-validator';
import { ServiceOrderStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';

/**
 * PATCH /service-orders/:id
 * Staff: PENDING → PREPARING → DELIVERED, or PENDING/PREPARING → CANCELLED.
 * Guests: may only cancel their own PENDING orders.
 */
export class UpdateServiceOrderDto {
  /** @example PREPARING */
  @ToUpperCase()
  @IsEnum(ServiceOrderStatus, { message: 'status must be one of: PENDING, PREPARING, DELIVERED, CANCELLED' })
  status!: ServiceOrderStatus;
}
