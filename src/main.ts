import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);

  const port = app.get(ConfigService).get<number>('PORT') ?? 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`MariStay API running at http://localhost:${port}/api/v1`);
  logger.log(`Swagger documentation at http://localhost:${port}/api/docs`);
}
void bootstrap();
