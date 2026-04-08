import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { SendChannelMessageDto } from './dto/send-channel-message.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateChannelDto) {
    if (dto.flowId) {
      const flow = await this.prisma.flow.findFirst({
        where: {
          id: dto.flowId,
          tenantId: dto.tenantId,
        },
      });

      if (!flow) {
        throw new NotFoundException('Flow not found');
      }
    }

    return this.prisma.channel.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        type: dto.type as any,
        flowId: dto.flowId,
        configJson: dto.configJson ?? {},
        webhookSecret: dto.webhookSecret,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.channel.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, tenantId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  async update(id: string, tenantId: string, dto: UpdateChannelDto) {
    await this.findOne(id, tenantId);

    if (dto.flowId) {
      const flow = await this.prisma.flow.findFirst({
        where: {
          id: dto.flowId,
          tenantId,
        },
      });

      if (!flow) {
        throw new NotFoundException('Flow not found');
      }
    }

    return this.prisma.channel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.flowId !== undefined && { flowId: dto.flowId }),
        ...(dto.configJson !== undefined && { configJson: dto.configJson }),
        ...(dto.webhookSecret !== undefined && {
          webhookSecret: dto.webhookSecret,
        }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.channel.delete({
      where: { id },
    });
  }

  async handleIncomingWebhook(
    id: string,
    payload: Record<string, any>,
    headers: Record<string, any>,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.status !== 'ACTIVE') {
      throw new BadRequestException('Channel is inactive');
    }

    const normalizedMessage = this.normalizeIncomingMessage(channel.type, payload);

    if (!normalizedMessage) {
      throw new BadRequestException('Unsupported incoming payload');
    }

    if (!channel.flowId) {
      throw new BadRequestException('Channel is not connected to a flow');
    }

    return {
      ok: true,
      channelId: channel.id,
      flowId: channel.flowId,
      message: normalizedMessage,
      headers,
    };
  }

  async sendMessage(id: string, tenantId: string, dto: SendChannelMessageDto) {
    const channel = await this.findOne(id, tenantId);

    if (channel.status !== 'ACTIVE') {
      throw new BadRequestException('Channel is inactive');
    }

    switch (channel.type) {
      case 'WHATSAPP':
        return this.sendWhatsapp(channel, dto);
      case 'TELEGRAM':
        return this.sendTelegram(channel, dto);
      case 'WEBCHAT':
        return this.sendWebchat(channel, dto);
      case 'INSTAGRAM':
        return this.sendInstagram(channel, dto);
      default:
        throw new BadRequestException('Unsupported channel type');
    }
  }

  private normalizeIncomingMessage(type: string, payload: any) {
    switch (type) {
      case 'WHATSAPP':
        return {
          externalUserId: payload?.from,
          text: payload?.text?.body ?? payload?.message,
          raw: payload,
        };

      case 'TELEGRAM':
        return {
          externalUserId: String(payload?.message?.from?.id ?? ''),
          text: payload?.message?.text,
          raw: payload,
        };

      case 'WEBCHAT':
        return {
          externalUserId: payload?.sessionId,
          text: payload?.message,
          raw: payload,
        };

      case 'INSTAGRAM':
        return {
          externalUserId: payload?.sender?.id,
          text: payload?.message?.text,
          raw: payload,
        };

      default:
        return null;
    }
  }

  private async sendWhatsapp(channel: any, dto: SendChannelMessageDto) {
    return {
      provider: 'WHATSAPP',
      channelId: channel.id,
      sent: true,
      to: dto.to,
      message: dto.message,
    };
  }

  private async sendTelegram(channel: any, dto: SendChannelMessageDto) {
    return {
      provider: 'TELEGRAM',
      channelId: channel.id,
      sent: true,
      to: dto.to,
      message: dto.message,
    };
  }

  private async sendWebchat(channel: any, dto: SendChannelMessageDto) {
    return {
      provider: 'WEBCHAT',
      channelId: channel.id,
      sent: true,
      to: dto.to,
      message: dto.message,
    };
  }

  private async sendInstagram(channel: any, dto: SendChannelMessageDto) {
    return {
      provider: 'INSTAGRAM',
      channelId: channel.id,
      sent: true,
      to: dto.to,
      message: dto.message,
    };
  }
}