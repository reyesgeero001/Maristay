import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaymentMethod, PaymentStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';

export class PaymentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reservationId?: number;

  @IsOptional()
  @ToUpperCase()
  @IsEnum(PaymentStatus, { message: 'Invalid payment status filter' })
  status?: PaymentStatus;

  @IsOptional()
  @ToUpperCase()
  @IsEnum(PaymentMethod, { message: 'Invalid payment method filter' })
  paymentMethod?: PaymentMethod;
}
