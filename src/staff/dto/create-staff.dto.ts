import { IsEmail, IsEnum, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { NAME_MESSAGE, NAME_REGEX } from '../../common/dto/person-fields';
import { StaffRole } from '../../common/enums';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../../common/utilities/security.util';
import { ToLowerCaseTrim, ToUpperCase, Trim } from '../../common/utilities/transform.util';

/** POST /staff — Manager creates an employee account (the only way to get a staff role). */
export class CreateStaffDto {
  /** @example Liza */
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(NAME_REGEX, { message: `firstName ${NAME_MESSAGE}` })
  firstName!: string;

  /** @example Soberano */
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(NAME_REGEX, { message: `lastName ${NAME_MESSAGE}` })
  lastName!: string;

  /** @example frontdesk2@maristay.test */
  @ToLowerCaseTrim()
  @IsEmail()
  @MaxLength(100)
  email!: string;

  /** FRONT_DESK, HOUSEKEEPING or MANAGER. @example FRONT_DESK */
  @ToUpperCase()
  @IsEnum(StaffRole, { message: 'role must be one of: FRONT_DESK, HOUSEKEEPING, MANAGER' })
  role!: StaffRole;

  /** Initial password (8–72 chars, letters and numbers). @example StaffPass123 */
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;
}
