import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DigitalKeyStatus } from '../../common/enums';
import { ToUpperCase } from '../../common/utilities/transform.util';

export class DigitalKeyQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reservationId?: number;

  @IsOptional()
  @ToUpperCase()
  @IsEnum(DigitalKeyStatus, { message: 'Invalid digital key status filter' })
  status?: DigitalKeyStatus;
}
