import { DataSourceOptions } from 'typeorm';
import { Guest } from '../guests/entities/guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DigitalKey } from '../digital-keys/entities/digital-key.entity';
import { Housekeeping } from '../housekeeping/entities/housekeeping.entity';
import { Staff } from '../staff/entities/staff.entity';
import { ServiceOrder } from '../service-orders/entities/service-order.entity';
import { InitialSchema1764086400000 } from './migrations/1764086400000-InitialSchema';

/** All eight Lab 04 entities, registered explicitly (no glob patterns). */
export const ENTITIES = [Guest, Room, Reservation, Payment, DigitalKey, Housekeeping, Staff, ServiceOrder];
export const MIGRATIONS = [InitialSchema1764086400000];

type Env = Record<string, string | undefined>;

function required(env: Env, key: string): string {
  const value = env[key];
  if (value === undefined || value === '') throw new Error(`Missing required environment variable ${key}`);
  return value;
}

/**
 * Builds the MySQL connection options from environment variables.
 * Shared by the NestJS app (AppModule), the TypeORM CLI (data-source.ts),
 * the seed script and the e2e tests, so every tool connects the same way.
 */
export function buildDataSourceOptions(env: Env = process.env, databaseOverride?: string): DataSourceOptions {
  return {
    type: 'mysql',
    host: required(env, 'DB_HOST'),
    port: Number(env.DB_PORT ?? 3306),
    username: required(env, 'DB_USERNAME'),
    password: env.DB_PASSWORD ?? '',
    database: databaseOverride ?? required(env, 'DB_DATABASE'),
    entities: ENTITIES,
    migrations: MIGRATIONS,
    // Schema changes only happen through migrations — never auto-sync.
    synchronize: false,
    migrationsRun: false,
    charset: 'utf8mb4_unicode_ci',
    // DATETIME values are written and read in the server's local time zone, the
    // same zone MySQL uses for CURRENT_TIMESTAMP defaults (createdAt/updatedAt),
    // so app-written and DB-generated timestamps agree and phpMyAdmin shows
    // hotel-local times. DATE columns are returned as plain 'YYYY-MM-DD' strings.
    timezone: 'local',
    dateStrings: ['DATE'],
    logging: env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
  };
}
