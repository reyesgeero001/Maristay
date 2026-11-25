import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ToUpperCase, Trim } from '../../common/utilities/transform.util';
import { SERVICE_ITEM_CODES } from '../service-catalog';

/**
 * POST /service-orders (Lab 05 #5). The client chooses WHAT to order; the
 * server decides the serviceType, price, total, status and date.
 */
export class CreateServiceOrderDto {
  /** A CHECKED_IN reservation of the guest. @example 1 */
  @IsInt()
  @Min(1)
  reservationId!: number;

  /** Catalog item (case-insensitive). @example BREAKFAST_SET */
  @ToUpperCase()
  @IsIn(SERVICE_ITEM_CODES, { message: `itemCode must be one of: ${SERVICE_ITEM_CODES.join(', ')}` })
  itemCode!: string;

  /** 1–20 units. @example 2 */
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  /** Optional instructions. @example No onions, please */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
