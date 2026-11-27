import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { AccountStatus } from '../../common/enums';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../../common/utilities/security.util';
import { ToUpperCase } from '../../common/utilities/transform.util';
import { CreateGuestDto } from './create-guest.dto';

/**
 * Partial profile update. Guests may change their own password by sending
 * `newPassword` together with `currentPassword`. Only a MANAGER may change
 * `accountStatus` (e.g. to reactivate an account).
 */
export class UpdateGuestDto extends PartialType(OmitType(CreateGuestDto, ['password'] as const)) {
  /** Required when changing the password. */
  @ValidateIf((o: UpdateGuestDto) => o.newPassword !== undefined)
  @IsString()
  @MaxLength(72)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword?: string;

  /** MANAGER only. @example ACTIVE */
  @IsOptional()
  @ToUpperCase()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}
