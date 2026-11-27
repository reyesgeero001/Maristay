import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AccountStatus } from '../../common/enums';
import { ToUpperCase, Trim } from '../../common/utilities/transform.util';

export class GuestQueryDto extends PaginationQueryDto {
  /** Matches first name, last name or email (partial). */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @ToUpperCase()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}
