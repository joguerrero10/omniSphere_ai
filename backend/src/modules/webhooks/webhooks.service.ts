import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWebhookEventDto } from './dto/create-webhook-event.dto';
import { RespondWebhookDto } from './dto/respond-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) { }

  async createEvent(dto: CreateWebhookEventDto) {
    return this.prisma.webhookEvent.create({
      data: {
        tenantId: dto.tenantId,
        flowExecutionId: dto.flowExecutionId,
        channelId: dto.channelId,
        direction: dto.direction as any,
        eventName: dto.eventName,
        targetUrl: dto.targetUrl,
        payloadJson: dto.payloadJson,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.webhookEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const event = await this.prisma.webhookEvent.findFirst({
      where: { id, tenantId },
    });

    if (!event) {
      throw new NotFoundException('Webhook event not found');
    }

    return event;
  }

  async respond(id: string, tenantId: string, dto: RespondWebhookDto) {
    await this.findOne(id, tenantId);

    return this.prisma.webhookEvent.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as any }),
        ...(dto.responseJson !== undefined && { responseJson: dto.responseJson }),
        ...(dto.errorMessage !== undefined && { errorMessage: dto.errorMessage }),
      },
    });
  }

  async triggerOutboundWebhook(dto: CreateWebhookEventDto) {
    const event = await this.createEvent(dto);

    try {
      // aquí luego harías la llamada real con HttpService o axios
      const fakeResponse = {
        ok: true,
        echoedPayload: dto.payloadJson,
      };

      return await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: 'SUCCESS',
          responseJson: fakeResponse,
        },
      });
    } catch (error: any) {
      return await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: 'FAILED',
          errorMessage: error?.message ?? 'Webhook call failed',
        },
      });
    }
  }

  async receiveInboundWebhook(
    tenantId: string,
    eventName: string,
    payload: Record<string, any>,
  ) {
    return this.prisma.webhookEvent.create({
      data: {
        tenantId,
        direction: 'INBOUND',
        eventName,
        payloadJson: payload,
        status: 'SUCCESS',
      },
    });
  }
}