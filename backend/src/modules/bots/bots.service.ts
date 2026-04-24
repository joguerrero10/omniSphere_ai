// src/bots/bots.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BotStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';

@Injectable()
export class BotsService {
  constructor(private prisma: PrismaService) { }

  async findAll(companyId: string) {
    return this.prisma.bot.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        model: true,
        status: true,
        avatarUrl: true,
        welcomeMsg: true,
        temperature: true,
        maxTokens: true,
        totalConversations: true,
        totalMessages: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const bot = await this.prisma.bot.findUnique({
      where: { id },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
    });

    if (!bot) throw new NotFoundException(`Bot #${id} no encontrado`);
    if (bot.companyId !== companyId)
      throw new ForbiddenException('No tienes acceso a este bot');

    return bot;
  }

  async create(companyId: string, dto: CreateBotDto) {
    return this.prisma.bot.create({
      data: {
        ...dto,
        companyId,
      },
    });
  }

  async update(id: string, companyId: string, dto: UpdateBotDto) {
    await this.findOne(id, companyId);

    return this.prisma.bot.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(id: string, companyId: string, status: BotStatus) {
    await this.findOne(id, companyId);

    return this.prisma.bot.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);

    await this.prisma.bot.delete({ where: { id } });
    return { message: 'Bot eliminado correctamente' };
  }

  async getStats(id: string, companyId: string) {
    const bot = await this.findOne(id, companyId);

    return {
      totalConversations: bot.totalConversations,
      totalMessages: bot.totalMessages,
      status: bot.status,
      createdAt: bot.createdAt,
    };
  }
}