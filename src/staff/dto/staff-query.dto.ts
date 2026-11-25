import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AccountStatus, StaffRole } from '../../common/enums';
import { ToUpperCase, Trim } from '../../common/utilities/transform.util';

export class StaffQueryDto extends PaginationQueryDto {
  @IsOptional()
  @ToUpperCase()
  @IsEnum(StaffRole, { message: 'Invalid staff role filter' })
  role?: StaffRole;

  @IsOptional()
  @ToUpperCase()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;

  /** Partial match on name or email. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;
}
