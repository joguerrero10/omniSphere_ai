import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService, PrismaService],
  exports: [ChannelsService],
})
export class ChannelsModule { }