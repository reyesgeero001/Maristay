import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { buildDataSourceOptions } from './database/database.config';

@Module({
  imports: [
    // Loads .env and validates it at startup (fails fast on bad config).
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // MySQL connection via TypeORM + mysql2. Values come only from environment variables.
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...buildDataSourceOptions(process.env), autoLoadEntities: false }),
    }),
  ],
})
export class AppModule {}
