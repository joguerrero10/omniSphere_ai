import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { BotsModule } from '../bots/bots.module';
import { GroqProvider } from '../nlu/providers/groq.provider';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  imports: [ConfigModule, BotsModule],
  controllers: [ChannelsController],
  providers: [ChannelsService, PrismaService, GroqProvider],
  exports: [ChannelsService],
})
export class ChannelsModule { }