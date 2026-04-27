import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { GroqProvider } from '../nlu/providers/groq.provider';
import { BotRulesController } from './bot-rules.controller';
import { BotRulesService } from './bot-rules.service';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';

@Module({
  imports: [ConfigModule],
  providers: [BotsService, PrismaService, GroqProvider, BotRulesService],
  controllers: [BotsController, BotRulesController],
  exports: [BotsService, BotRulesService]
})
export class BotsModule { }
