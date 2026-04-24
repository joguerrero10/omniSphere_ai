import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';

@Module({
  providers: [BotsService, PrismaService],
  controllers: [BotsController, BotsService],
  exports: [BotsService]
})
export class BotsModule { }
