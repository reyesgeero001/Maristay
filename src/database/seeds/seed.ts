import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../database.config';
import { DEMO_GUESTS, DEMO_STAFF, seedDemoData } from './demo-data.seed';

/**
 * Usage: npm run seed
 * Requires the schema (npm run migration:run) and SEED_DEMO_PASSWORD in .env.
 */
async function main(): Promise<void> {
  dotenv.config({ quiet: true });
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.startsWith('replace_with')) {
    throw new Error('Set SEED_DEMO_PASSWORD in your .env file before seeding.');
  }

  const dataSource = new DataSource(buildDataSourceOptions(process.env));
  await dataSource.initialize();
  try {
    const summary = await seedDemoData(dataSource, demoPassword);
    console.log('Seed completed:', summary);
    console.log('Demo accounts (password = SEED_DEMO_PASSWORD from your .env):');
    for (const s of DEMO_STAFF) console.log(`  ${s.role.padEnd(12)} ${s.email}`);
    for (const g of DEMO_GUESTS) console.log(`  ${'GUEST'.padEnd(12)} ${g.email}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: Error) => {
  console.error(`Seeding failed: ${error.message}`);
  process.exit(1);
});
