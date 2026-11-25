import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Validates environment variables when the application starts.
 * The app refuses to boot with missing values or an insecure JWT secret,
 * so there is never a hardcoded fallback secret.
 */
class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 3306;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME!: string;

  // May legitimately be empty for a local XAMPP root account, but must be defined.
  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_]+$/, { message: 'DB_DATABASE may only contain letters, numbers and _' })
  DB_DATABASE!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long' })
  @Matches(/^(?!replace_with).*/, { message: 'JWT_SECRET still contains the placeholder value' })
  JWT_SECRET!: string;

  @IsString()
  @Matches(/^\d+[smhd]?$/, { message: 'JWT_EXPIRES_IN must look like 3600, 15m, 1h or 1d' })
  JWT_EXPIRES_IN: string = '1h';

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${details}`);
  }
  return { ...config, ...validated };
}
