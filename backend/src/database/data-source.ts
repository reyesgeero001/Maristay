import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.config';

/** Used by the TypeORM CLI: `npm run migration:run`, `npm run schema:check`, ... */
dotenv.config({ quiet: true });

export default new DataSource(buildDataSourceOptions(process.env));
