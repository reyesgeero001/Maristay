import { OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { AccountStatus } from '../../common/enums';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../../common/utilities/security.util';
import { ToUpperCase } from '../../common/utilities/transform.util';
import { CreateStaffDto } from './create-staff.dto';

/** PATCH /staff/:id — Manager updates details, role, status or resets the password. */
export class UpdateStaffDto extends PartialType(OmitType(CreateStaffDto, ['password'] as const)) {
  /** @example ACTIVE */
  @IsOptional()
  @ToUpperCase()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;

  /** Password reset by the manager. @example NewStaffPass123 */
  @IsOptional()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword?: string;
}
