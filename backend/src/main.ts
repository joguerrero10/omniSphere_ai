import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = config.get<number>('PORT') ?? 3000;
  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3001';

  app.enableCors({
    origin: [corsOrigin],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}/api`);
}

bootstrap();