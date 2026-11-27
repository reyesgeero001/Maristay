import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { createConnection } from 'mysql2/promise';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../src/database/database.config';
import { seedDemoData } from '../src/database/seeds/demo-data.seed';

/** Password given to seeded accounts in the throw-away e2e database only. */
export const TEST_PASSWORD = 'E2eTestPass123';

/**
 * Prepares an isolated MySQL database for the e2e suite:
 * drop + create `TEST_DB_DATABASE` (must end with `_test`, so the demo
 * database can never be touched), run the real migrations, seed demo data.
 */
export async function prepareTestDatabase(): Promise<string> {
  dotenv.config({ quiet: true });
  const name = process.env.TEST_DB_DATABASE ?? 'maristay_test_db';
  if (!/^[A-Za-z0-9_]+_test(_db)?$/.test(name)) {
    throw new Error(`Refusing to reset "${name}": the e2e database name must end with _test or _test_db`);
  }

  const conn = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD ?? '',
  });
  await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
  await conn.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();

  const dataSource = new DataSource(buildDataSourceOptions(process.env, name));
  await dataSource.initialize();
  await dataSource.runMigrations();
  await seedDemoData(dataSource, TEST_PASSWORD);
  await dataSource.destroy();

  // The Nest app reads DB_DATABASE when it boots.
  process.env.DB_DATABASE = name;
  return name;
}
