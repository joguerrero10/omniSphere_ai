import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import * as express from "express";
import { AppModule } from "./app.module";
import { PrismaService } from "./database/prisma.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const prisma = app.get(PrismaService);
  const logger = new Logger("Bootstrap");

  await prisma.enableShutdownHooks(app);

  const port = config.get<number>("PORT") ?? 3000;

  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.enableCors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port, "0.0.0.0");

  logger.log(`Server running on http://localhost:${port}/api`);
}

bootstrap();