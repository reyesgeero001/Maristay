import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ServiceOrderStatus, ServiceType } from '../../common/enums';
import { ToTitleCase, ToUpperCase } from '../../common/utilities/transform.util';

export class ServiceOrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @ToUpperCase()
  @IsEnum(ServiceOrderStatus, { message: 'Invalid service order status filter' })
  status?: ServiceOrderStatus;

  @IsOptional()
  @ToTitleCase()
  @IsEnum(ServiceType, { message: 'Invalid service type filter' })
  serviceType?: ServiceType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reservationId?: number;
}
