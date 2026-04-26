import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { GroqModule } from '../groq/groq.module';
import { GroqProvider } from '../nlu/providers/groq.provider';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';

@Module({
  imports: [GroqModule, ConfigModule],
  providers: [BotsService, PrismaService, GroqProvider],
  controllers: [BotsController],
  exports: [BotsService]
})
export class BotsModule { }
