import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BotStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { GroqProvider } from '../nlu/providers/groq.provider';
import { ChatBotDto } from './dto/chat-bot.dto';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotModeDto } from './dto/update-bot-rule.dto';
import { UpdateBotDto } from './dto/update-bot.dto';

@Injectable()
export class BotsService {
  constructor(private prisma: PrismaService, private groq: GroqProvider,) { }

  async findAll(tenantId: string) {
    return this.prisma.bot.findMany({
      where: { tenantId },
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
        responseMode: true,
        mainMenuText: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const bot = await this.prisma.bot.findUnique({
      where: { id },
    });

    if (!bot) throw new NotFoundException(`Bot #${id} no encontrado`);
    if (bot.tenantId !== tenantId)
      throw new ForbiddenException('No tienes acceso a este bot');

    return bot;
  }

  async create(tenantId: string, dto: CreateBotDto) {
    return this.prisma.bot.create({
      data: { ...dto, tenantId },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateBotDto) {
    await this.findOne(id, tenantId);
    return this.prisma.bot.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, tenantId: string, status: BotStatus) {
    await this.findOne(id, tenantId);
    return this.prisma.bot.update({ where: { id }, data: { status } });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.bot.delete({ where: { id } });
    return { message: 'Bot eliminado correctamente' };
  }

  async getStats(id: string, tenantId: string) {
    const bot = await this.findOne(id, tenantId);
    return {
      totalConversations: bot.totalConversations,
      totalMessages: bot.totalMessages,
      status: bot.status,
      createdAt: bot.createdAt,
    };
  }

  async chat(id: string, tenantId: string, dto: ChatBotDto) {
    const bot = await this.findOne(id, tenantId);

    const messages = [
      ...(bot.systemPrompt
        ? [{ role: 'system' as const, content: bot.systemPrompt }]
        : []),
      ...dto.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const result = await this.groq.complete({
      prompt: '',
      model: bot.model,
      temperature: bot.temperature,
      maxTokens: bot.maxTokens,
      messages,
    });

    this.prisma.bot
      .update({
        where: { id },
        data: { totalMessages: { increment: dto.messages.length + 1 } },
      })
      .catch(() => { });

    return {
      role: 'assistant' as const,
      content: result.text,
      model: result.model,
      usage: result.usage,
    };
  }
  private async checkBotAccess(botId: string, tenantId: string) {
    const bot = await this.prisma.bot.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Bot not found');
    if (bot.tenantId !== tenantId) throw new ForbiddenException('No tienes acceso a este bot');
    return bot;
  }

  async updateMode(botId: string, tenantId: string, dto: UpdateBotModeDto) {
    await this.checkBotAccess(botId, tenantId);
    return this.prisma.bot.update({
      where: { id: botId },
      data: {
        responseMode: dto.responseMode,
        ...(dto.mainMenuText !== undefined && { mainMenuText: dto.mainMenuText }),
      },
      select: { id: true, responseMode: true, mainMenuText: true },
    });
  }
}