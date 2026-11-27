import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ToLowerCaseTrim } from '../../common/utilities/transform.util';

export class LoginDto {
  /** Guest or staff email address. @example juan.delacruz@example.com */
  @ToLowerCaseTrim()
  @IsEmail()
  @MaxLength(100)
  email!: string;

  /** Account password. @example YourDemoPassword1 */
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
