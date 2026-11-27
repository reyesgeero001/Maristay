import * as dotenv from 'dotenv';
import { createConnection } from 'mysql2/promise';

/**
 * Creates the MariStay database if it does not exist yet.
 * Non-destructive: it never drops or alters an existing database.
 * Usage: npm run db:create
 */
async function main(): Promise<void> {
  dotenv.config({ quiet: true });
  const database = process.env.DB_DATABASE;
  if (!database || !/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('DB_DATABASE must be set and contain only letters, numbers and _');
  }

  const connection = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD ?? '',
  });
  try {
    // The name is validated above; identifiers cannot be bound as parameters.
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`Database "${database}" is ready.`);
  } finally {
    await connection.end();
  }
}

main().catch((error: Error) => {
  console.error(`Could not create the database: ${error.message}`);
  process.exit(1);
});
