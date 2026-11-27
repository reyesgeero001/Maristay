import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

export const API_PREFIX = 'api/v1';

/**
 * Applies the global HTTP pipeline. Shared by main.ts and the e2e tests so
 * that tests exercise exactly the same security configuration.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX);

  // Security headers (CSP, X-Content-Type-Options, X-Frame-Options, HSTS, ...).
  // The API serves JSON only, so Helmet's defaults apply in every environment.
  app.use(helmet());

  // Restricted CORS: only the configured front-end origin(s) may call the API from a browser.
  const origins = (config.get<string>('CORS_ORIGIN') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : false, credentials: false });

  // Global DTO validation:
  //  - whitelist strips properties without decorators
  //  - forbidNonWhitelisted rejects unknown properties (prevents mass assignment)
  //  - transform converts payloads into DTO class instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );

  // Honors @Exclude() on entities (passwordHash, keyCodeHash never leave the server).
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());
}
