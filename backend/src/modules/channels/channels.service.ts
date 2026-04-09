import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common";
import { Channel, ChannelStatus, ChannelType, Prisma } from "@prisma/client";
import { timingSafeEqual } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { SendChannelMessageDto } from "./dto/send-channel-message.dto";
import { UpdateChannelDto } from "./dto/update-channel.dto";

type NormalizedIncomingMessage = {
  externalUserId: string;
  text: string;
  raw: Record<string, unknown>;
};

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) { }

  private toPrismaJsonObject(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue {
    return (value ?? {}) as Prisma.InputJsonValue;
  }
  private toPrismaJsonUpdate(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value as Prisma.InputJsonValue;
  }

  async create(tenantId: string, dto: CreateChannelDto) {
    if (dto.flowId) {
      const flow = await this.prisma.flow.findFirst({
        where: {
          id: dto.flowId,
          tenantId,
        },
      });

      if (!flow) {
        throw new NotFoundException("Flow not found");
      }
    }

    return this.prisma.channel.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type,
        flowId: dto.flowId,
        configJson: this.toPrismaJsonObject(dto.configJson),
        webhookSecret: dto.webhookSecret,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.channel.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, tenantId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, tenantId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
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
        throw new NotFoundException("Flow not found");
      }
    }

    return this.prisma.channel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.flowId !== undefined && { flowId: dto.flowId }),
        ...(dto.configJson !== undefined && { configJson: this.toPrismaJsonObject(dto.configJson) }),
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
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new BadRequestException("Channel is inactive");
    }

    this.validateWebhookSecret(channel, headers);

    const normalizedMessage = this.normalizeIncomingMessage(channel.type, payload);

    if (!normalizedMessage) {
      throw new BadRequestException("Unsupported incoming payload");
    }

    if (!channel.flowId) {
      throw new BadRequestException("Channel is not connected to a flow");
    }

    return {
      ok: true,
      channelId: channel.id,
      flowId: channel.flowId,
      message: normalizedMessage,
    };
  }

  async sendMessage(id: string, tenantId: string, dto: SendChannelMessageDto) {
    const channel = await this.findOne(id, tenantId);

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new BadRequestException("Channel is inactive");
    }

    switch (channel.type) {
      case ChannelType.WHATSAPP:
        return this.sendWhatsapp(channel, dto);
      case ChannelType.TELEGRAM:
        return this.sendTelegram(channel, dto);
      case ChannelType.WEBCHAT:
        return this.sendWebchat(channel, dto);
      case ChannelType.INSTAGRAM:
        return this.sendInstagram(channel, dto);
      default:
        throw new BadRequestException("Unsupported channel type");
    }
  }

  private validateWebhookSecret(
    channel: Channel,
    headers: Record<string, string | string[] | undefined>,
  ) {
    if (!channel.webhookSecret) {
      return;
    }

    const incomingSecret = this.getSingleHeaderValue(headers["x-webhook-secret"]);

    if (!incomingSecret) {
      throw new ForbiddenException("Missing webhook secret");
    }

    if (!this.safeCompare(incomingSecret, channel.webhookSecret)) {
      throw new ForbiddenException("Invalid webhook signature");
    }
  }

  private normalizeIncomingMessage(
    type: ChannelType,
    payload: Record<string, unknown>,
  ): NormalizedIncomingMessage | null {
    switch (type) {
      case ChannelType.WHATSAPP: {
        const text = this.readWhatsappText(payload);
        const externalUserId = this.readString(payload["from"]);

        if (!text || !externalUserId) {
          return null;
        }

        return {
          externalUserId,
          text,
          raw: payload,
        };
      }

      case ChannelType.TELEGRAM: {
        const message = this.asRecord(payload["message"]);
        const from = this.asRecord(message?.["from"]);
        const text = this.readString(message?.["text"]);
        const externalUserId = this.readString(from?.["id"]);

        if (!text || !externalUserId) {
          return null;
        }

        return {
          externalUserId,
          text,
          raw: payload,
        };
      }

      case ChannelType.WEBCHAT: {
        const externalUserId = this.readString(payload["sessionId"]);
        const text = this.readString(payload["message"]);

        if (!text || !externalUserId) {
          return null;
        }

        return {
          externalUserId,
          text,
          raw: payload,
        };
      }

      case ChannelType.INSTAGRAM: {
        const sender = this.asRecord(payload["sender"]);
        const message = this.asRecord(payload["message"]);
        const externalUserId = this.readString(sender?.["id"]);
        const text = this.readString(message?.["text"]);

        if (!text || !externalUserId) {
          return null;
        }

        return {
          externalUserId,
          text,
          raw: payload,
        };
      }

      default:
        return null;
    }
  }

  private readWhatsappText(payload: Record<string, unknown>): string | null {
    const text = this.asRecord(payload["text"]);
    return this.readString(text?.["body"]) ?? this.readString(payload["message"]);
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown): string | null {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }

    return null;
  }

  private getSingleHeaderValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
      return typeof value[0] === "string" ? value[0] : null;
    }

    return typeof value === "string" ? value : null;
  }

  private safeCompare(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private async sendWhatsapp(_channel: Channel, _dto: SendChannelMessageDto) {
    throw new NotImplementedException("WhatsApp provider not implemented yet");
  }

  private async sendTelegram(_channel: Channel, _dto: SendChannelMessageDto) {
    throw new NotImplementedException("Telegram provider not implemented yet");
  }

  private async sendWebchat(_channel: Channel, _dto: SendChannelMessageDto) {
    throw new NotImplementedException("Webchat provider not implemented yet");
  }

  private async sendInstagram(_channel: Channel, _dto: SendChannelMessageDto) {
    throw new NotImplementedException("Instagram provider not implemented yet");
  }
}