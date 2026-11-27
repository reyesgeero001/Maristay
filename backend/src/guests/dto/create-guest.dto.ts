import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { NAME_MESSAGE, NAME_REGEX, PHONE_MESSAGE, PHONE_REGEX } from '../../common/dto/person-fields';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../../common/utilities/security.util';
import { ToLowerCaseTrim, Trim } from '../../common/utilities/transform.util';

/** Public guest self-registration (Lab 05 endpoint #2). Always creates a GUEST account. */
export class CreateGuestDto {
  /** @example Geero Andrei */
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(NAME_REGEX, { message: `firstName ${NAME_MESSAGE}` })
  firstName!: string;

  /** @example Reyes */
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(NAME_REGEX, { message: `lastName ${NAME_MESSAGE}` })
  lastName!: string;

  /** @example geero.reyes@example.com */
  @ToLowerCaseTrim()
  @IsEmail()
  @MaxLength(100)
  email!: string;

  /** 8–72 characters with at least one letter and one number. @example SecurePass123 */
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;

  /** Spaces and dashes are ignored. @example 09123456789 */
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value))
  @IsString()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phoneNumber!: string;
}
