// src/modules/channels/channels.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Channel, ChannelStatus, ChannelType, MessageRole, Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { GroqProvider } from '../nlu/providers/groq.provider';
import { CreateChannelDto } from './dto/create-channel.dto';
import { SendChannelMessageDto } from './dto/send-channel-message.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

type NormalizedIncomingMessage = {
  externalUserId: string;
  text: string;
  raw: Record<string, unknown>;
};

type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
  verifyToken?: string;
  appSecret?: string;
  skipSignatureValidation?: boolean;
};

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqProvider,   // ← NUEVO
  ) { }

  private toPrismaJsonObject(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue {
    return (value ?? {}) as Prisma.InputJsonValue;
  }

  // ─── CRUD ─────────────────────────────────────────────────────

  async create(tenantId: string, dto: CreateChannelDto) {
    if (dto.flowId) {
      const flow = await this.prisma.flow.findFirst({
        where: { id: dto.flowId, tenantId },
      });
      if (!flow) throw new NotFoundException('Flow not found');
    }

    if (dto.botId) {
      const bot = await this.prisma.bot.findFirst({
        where: { id: dto.botId, tenantId },
      });
      if (!bot) throw new NotFoundException('Bot not found');
    }

    this.validateConfigByType(dto.type as unknown as ChannelType, dto.configJson);

    return this.prisma.channel.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type as unknown as ChannelType,
        flowId: dto.flowId,
        botId: dto.botId ?? null,
        status: ChannelStatus.ACTIVE,
        configJson: this.toPrismaJsonObject(dto.configJson),
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
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async findByBotId(botId: string, tenantId: string) {
    return this.prisma.channel.findFirst({
      where: { botId, tenantId, type: ChannelType.WHATSAPP },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateChannelDto) {
    const existing = await this.findOne(id, tenantId);

    if (dto.flowId) {
      const flow = await this.prisma.flow.findFirst({
        where: { id: dto.flowId, tenantId },
      });
      if (!flow) throw new NotFoundException('Flow not found');
    }

    if (dto.botId) {
      const bot = await this.prisma.bot.findFirst({
        where: { id: dto.botId, tenantId },
      });
      if (!bot) throw new NotFoundException('Bot not found');
    }

    const nextType = (dto.type as unknown as ChannelType) ?? existing.type;
    const nextConfig = dto.configJson ?? this.getChannelConfig(existing);

    this.validateConfigByType(nextType, nextConfig);

    return this.prisma.channel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as unknown as ChannelType }),
        ...(dto.status !== undefined && { status: dto.status as unknown as ChannelStatus }),
        ...(dto.flowId !== undefined && { flowId: dto.flowId }),
        ...(dto.botId !== undefined && { botId: dto.botId }),
        ...(dto.configJson !== undefined && { configJson: this.toPrismaJsonObject(dto.configJson) }),
        ...(dto.webhookSecret !== undefined && { webhookSecret: dto.webhookSecret }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.channel.delete({ where: { id } });
  }

  // ─── Webhook ──────────────────────────────────────────────────

  async verifyWebhook(id: string, query: Record<string, unknown>) {
    const channel = await this.prisma.channel.findFirst({ where: { id } });
    if (!channel) throw new NotFoundException('Channel not found');

    if (channel.type !== ChannelType.WHATSAPP) {
      throw new BadRequestException('Webhook verification only implemented for WhatsApp');
    }

    const mode = this.readString(query['hub.mode']);
    const token = this.readString(query['hub.verify_token']);
    const challenge = this.readString(query['hub.challenge']);

    if (!mode || !token || !challenge) {
      throw new BadRequestException('Missing WhatsApp webhook verification params');
    }
    if (mode !== 'subscribe') throw new BadRequestException('Invalid hub.mode');

    const cfg = this.getWhatsappConfig(channel);
    const expectedToken = cfg.verifyToken ?? channel.webhookSecret ?? null;

    if (!expectedToken) {
      throw new BadRequestException('Missing verifyToken in channel configJson or webhookSecret');
    }
    if (!this.safeCompare(token, expectedToken)) {
      throw new ForbiddenException('Invalid verify token');
    }

    return challenge;
  }

  async handleIncomingWebhook(
    id: string,
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
    rawBody?: Buffer,
  ) {
    const channel = await this.prisma.channel.findFirst({ where: { id } });
    if (!channel) throw new NotFoundException('Channel not found');

    if (channel.type !== ChannelType.WHATSAPP) {
      throw new BadRequestException('Incoming webhook only implemented for WhatsApp');
    }
    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new BadRequestException('Channel is inactive');
    }

    this.validateIncomingRequest(channel, headers, rawBody);

    const normalizedMessage = this.normalizeIncomingMessage(channel.type, payload);

    if (!normalizedMessage) {
      return {
        ok: true,
        ignored: true,
        reason: 'Webhook received but no inbound user text message was found',
      };
    }

    // ─── Si hay un bot vinculado → guardar + responder con Groq ──
    if (channel.botId) {
      // Guardamos el mensaje y obtenemos la respuesta de Groq en paralelo
      const [, replyText] = await Promise.all([
        this.saveMessage(channel.botId, normalizedMessage.text, MessageRole.USER, normalizedMessage.externalUserId),
        this.generateBotReply(channel.botId, normalizedMessage.text),
      ]);

      if (replyText) {
        // Guardar respuesta del asistente en la BD
        await this.saveMessage(channel.botId, replyText, MessageRole.ASSISTANT, null);

        // Enviar respuesta por WhatsApp
        await this.sendWhatsapp(channel, {
          to: normalizedMessage.externalUserId,
          message: replyText,
        }).catch((err) => {
          this.logger.error('Failed to send WhatsApp reply', err);
        });
      }
    }

    return {
      ok: true,
      channelId: channel.id,
      botId: channel.botId ?? null,
      received: {
        from: normalizedMessage.externalUserId,
        text: normalizedMessage.text,
      },
    };
  }

  // ─── Generar respuesta con Groq ───────────────────────────────
  private async generateBotReply(botId: string, userText: string): Promise<string | null> {
    try {
      const bot = await this.prisma.bot.findUnique({ where: { id: botId } });
      if (!bot) return null;

      // Obtener historial reciente de la conversación (últimos 10 mensajes)
      const conversation = await this.prisma.conversation.findFirst({
        where: { botId },
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10,
          },
        },
      });

      const history = (conversation?.messages ?? []).map((m) => ({
        role: m.role === MessageRole.USER ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

      // Agregar el mensaje actual
      history.push({ role: 'user', content: userText });

      const result = await this.groq.complete({
        prompt: '',
        model: bot.model,
        temperature: bot.temperature,
        maxTokens: bot.maxTokens,
        messages: [
          ...(bot.systemPrompt
            ? [{ role: 'system' as const, content: bot.systemPrompt }]
            : []),
          ...history,
        ],
      });

      return result.text;
    } catch (err) {
      this.logger.error('Groq reply failed', err);
      return null;
    }
  }

  // ─── Guardar mensaje en Conversation/Message ──────────────────
  private async saveMessage(
    botId: string,
    content: string,
    role: MessageRole,
    from: string | null,
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { botId },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { botId },
      });
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role,
        content,
        metadata: from
          ? ({ channel: 'WHATSAPP', from } as Prisma.InputJsonValue)
          : undefined,
      },
    });

    // Actualizar contador del bot
    await this.prisma.bot.update({
      where: { id: botId },
      data: { totalMessages: { increment: 1 } },
    }).catch(() => { });
  }

  async sendMessage(id: string, tenantId: string, dto: SendChannelMessageDto) {
    const channel = await this.findOne(id, tenantId);
    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new BadRequestException('Channel is inactive');
    }

    switch (channel.type) {
      case ChannelType.WHATSAPP: return this.sendWhatsapp(channel, dto);
      case ChannelType.TELEGRAM: throw new BadRequestException('Telegram provider not implemented yet');
      case ChannelType.WEBCHAT: throw new BadRequestException('Webchat provider not implemented yet');
      case ChannelType.INSTAGRAM: throw new BadRequestException('Instagram provider not implemented yet');
      default: throw new BadRequestException('Unsupported channel type');
    }
  }

  // ─── Helpers (sin cambios) ─────────────────────────────────────

  private validateConfigByType(type: ChannelType, config?: Record<string, unknown>) {
    const cfg = config ?? {};
    switch (type) {
      case ChannelType.WHATSAPP: {
        const accessToken = this.readString(cfg['accessToken']);
        const phoneNumberId = this.readString(cfg['phoneNumberId']);
        const apiVersion = this.readString(cfg['apiVersion']);
        const verifyToken = this.readString(cfg['verifyToken']);
        const appSecret = this.readString(cfg['appSecret']);

        if (!accessToken) throw new BadRequestException('WHATSAPP configJson.accessToken is required');
        if (!phoneNumberId) throw new BadRequestException('WHATSAPP configJson.phoneNumberId is required');
        if (apiVersion && !/^v\d+\.\d+$/.test(apiVersion))
          throw new BadRequestException('WHATSAPP configJson.apiVersion must look like v23.0');
        if (verifyToken !== null && verifyToken.length < 4)
          throw new BadRequestException('WHATSAPP configJson.verifyToken is too short');
        if (appSecret !== null && appSecret.length < 8)
          throw new BadRequestException('WHATSAPP configJson.appSecret looks invalid');
        return;
      }
      default: return;
    }
  }

  private validateIncomingRequest(
    channel: Channel,
    headers: Record<string, string | string[] | undefined>,
    rawBody?: Buffer,
  ) {
    if (channel.type === ChannelType.WHATSAPP) {
      this.validateWhatsappSignature(channel, headers, rawBody);
      return;
    }
    if (!channel.webhookSecret) return;
    const incomingSecret = this.getSingleHeaderValue(headers['x-webhook-secret']);
    if (!incomingSecret) throw new ForbiddenException('Missing webhook secret');
    if (!this.safeCompare(incomingSecret, channel.webhookSecret))
      throw new ForbiddenException('Invalid webhook secret');
  }

  private validateWhatsappSignature(
    channel: Channel,
    headers: Record<string, string | string[] | undefined>,
    rawBody?: Buffer,
  ) {
    const cfg = this.getWhatsappConfig(channel);
    if (cfg.skipSignatureValidation === true) return;
    const appSecret = cfg.appSecret;
    if (!appSecret) return;

    const signatureHeader = this.getSingleHeaderValue(headers['x-hub-signature-256']);
    if (!signatureHeader) throw new ForbiddenException('Missing X-Hub-Signature-256 header');
    if (!signatureHeader.startsWith('sha256='))
      throw new ForbiddenException('Invalid X-Hub-Signature-256 format');
    if (!rawBody || rawBody.length === 0)
      throw new ForbiddenException('rawBody is required to validate WhatsApp signature');

    const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    if (!this.safeCompare(signatureHeader, expectedSignature))
      throw new ForbiddenException('Invalid WhatsApp signature');
  }

  private normalizeIncomingMessage(
    type: ChannelType,
    payload: Record<string, unknown>,
  ): NormalizedIncomingMessage | null {
    switch (type) {
      case ChannelType.WHATSAPP: return this.normalizeWhatsappIncoming(payload);
      case ChannelType.TELEGRAM: {
        const message = this.asRecord(payload['message']);
        const from = this.asRecord(message?.['from']);
        const text = this.readString(message?.['text']);
        const externalUserId = this.readString(from?.['id']);
        if (!text || !externalUserId) return null;
        return { externalUserId, text, raw: payload };
      }
      case ChannelType.WEBCHAT: {
        const externalUserId = this.readString(payload['sessionId']);
        const text = this.readString(payload['message']);
        if (!text || !externalUserId) return null;
        return { externalUserId, text, raw: payload };
      }
      case ChannelType.INSTAGRAM: {
        const sender = this.asRecord(payload['sender']);
        const message = this.asRecord(payload['message']);
        const externalUserId = this.readString(sender?.['id']);
        const text = this.readString(message?.['text']);
        if (!text || !externalUserId) return null;
        return { externalUserId, text, raw: payload };
      }
      default: return null;
    }
  }

  private normalizeWhatsappIncoming(
    payload: Record<string, unknown>,
  ): NormalizedIncomingMessage | null {
    const entry = this.readFirstArrayItem(payload['entry']);
    const entryRecord = this.asRecord(entry);
    const changes = this.readFirstArrayItem(entryRecord?.['changes']);
    const changesRecord = this.asRecord(changes);
    const value = this.asRecord(changesRecord?.['value']);

    if (!value) return null;

    const statuses = value['statuses'];
    if (Array.isArray(statuses) && statuses.length > 0) return null;

    const messages = this.readFirstArrayItem(value['messages']);
    const message = this.asRecord(messages);
    if (!message) return null;

    const from = this.readString(message['from']);
    const type = this.readString(message['type']);
    if (!from || !type) return null;

    let text: string | null = null;

    if (type === 'text') {
      const textObj = this.asRecord(message['text']);
      text = this.readString(textObj?.['body']);
    } else if (type === 'button') {
      const buttonObj = this.asRecord(message['button']);
      text = this.readString(buttonObj?.['text']);
    } else if (type === 'interactive') {
      const interactive = this.asRecord(message['interactive']);
      const buttonReply = this.asRecord(interactive?.['button_reply']);
      const listReply = this.asRecord(interactive?.['list_reply']);
      text = this.readString(buttonReply?.['title']) ?? this.readString(listReply?.['title']);
    }

    if (!text) return null;
    return { externalUserId: from, text, raw: payload };
  }

  private getChannelConfig(channel: Channel): Record<string, unknown> {
    const value = channel.configJson;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  private getWhatsappConfig(channel: Channel): WhatsAppConfig {
    const cfg = this.getChannelConfig(channel);
    return {
      accessToken: this.readString(cfg['accessToken']) ?? '',
      phoneNumberId: this.readString(cfg['phoneNumberId']) ?? '',
      apiVersion: this.readString(cfg['apiVersion']) ?? 'v23.0',
      verifyToken: this.readString(cfg['verifyToken']) ?? undefined,
      appSecret: this.readString(cfg['appSecret']) ?? undefined,
      skipSignatureValidation: cfg['skipSignatureValidation'] === true,
    };
  }

  private async sendWhatsapp(channel: Channel, dto: SendChannelMessageDto) {
    const cfg = this.getWhatsappConfig(channel);

    if (!cfg.accessToken) throw new BadRequestException('WhatsApp accessToken missing in channel configJson');
    if (!cfg.phoneNumberId) throw new BadRequestException('WhatsApp phoneNumberId missing in channel configJson');

    const apiVersion = cfg.apiVersion ?? 'v23.0';
    const url = `https://graph.facebook.com/${apiVersion}/${cfg.phoneNumberId}/messages`;

    const requestBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.normalizePhoneNumber(dto.to),
      type: 'text',
      text: { preview_url: false, body: dto.message },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error connecting to WhatsApp API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    const responseText = await response.text();
    let responseJson: unknown = null;
    try { responseJson = responseText ? JSON.parse(responseText) : null; }
    catch { responseJson = { raw: responseText }; }

    if (!response.ok) {
      throw new BadRequestException({
        message: 'WhatsApp send failed',
        statusCode: response.status,
        providerResponse: responseJson,
      });
    }

    return { ok: true, provider: 'WHATSAPP', channelId: channel.id, request: requestBody, response: responseJson };
  }

  private normalizePhoneNumber(value: string): string {
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) throw new BadRequestException('Destination phone number is invalid for WhatsApp');
    return digits;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  }

  private readString(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number') return String(value);
    return null;
  }

  private readFirstArrayItem(value: unknown): unknown {
    if (!Array.isArray(value) || value.length === 0) return null;
    return value[0];
  }

  private getSingleHeaderValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : null;
    return typeof value === 'string' ? value : null;
  }

  private safeCompare(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, 'utf8');
    const rightBuffer = Buffer.from(right, 'utf8');
    if (leftBuffer.length !== rightBuffer.length) return false;
    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}