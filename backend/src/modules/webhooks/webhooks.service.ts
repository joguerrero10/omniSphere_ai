import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common";
import { ChannelStatus, Prisma, WebhookDirection, WebhookEventStatus } from "@prisma/client";
import { timingSafeEqual } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { CreateWebhookEventDto } from "./dto/create-webhook-event.dto";
import { RespondWebhookDto } from "./dto/respond-webhook.dto";

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) { }

  async createEvent(tenantId: string, dto: CreateWebhookEventDto) {
    return this.prisma.webhookEvent.create({
      data: {
        tenantId,
        flowExecutionId: dto.flowExecutionId,
        channelId: dto.channelId,
        direction: dto.direction,
        eventName: dto.eventName,
        targetUrl: dto.targetUrl,
        payloadJson: this.toPrismaJson(dto.payloadJson),
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.webhookEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, tenantId: string) {
    const event = await this.prisma.webhookEvent.findFirst({
      where: { id, tenantId },
    });

    if (!event) {
      throw new NotFoundException("Webhook event not found");
    }

    return event;
  }

  async respond(id: string, tenantId: string, dto: RespondWebhookDto) {
    await this.findOne(id, tenantId);

    return this.prisma.webhookEvent.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.responseJson !== undefined && { responseJson: this.toPrismaJson(dto.responseJson) }),
        ...(dto.errorMessage !== undefined && { errorMessage: dto.errorMessage }),
      },
    });
  }

  async triggerOutboundWebhook(tenantId: string, dto: CreateWebhookEventDto) {
    const event = await this.createEvent(tenantId, dto);

    await this.prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: WebhookEventStatus.FAILED,
        errorMessage: "Outbound webhook delivery is not implemented yet",
      },
    });

    throw new NotImplementedException("Outbound webhook delivery is not implemented yet");
  }

  async receiveInboundWebhook(
    channelId: string,
    eventName: string,
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
    sourceIp: string,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new BadRequestException("Channel is inactive");
    }

    this.validateWebhookSecret(channel.webhookSecret, headers);
    const payloadJson: Prisma.InputJsonValue = {
      data: payload as Prisma.InputJsonValue,
      meta: {
        sourceIp,
        receivedAt: new Date().toISOString(),
        headers: headers as Prisma.InputJsonValue,
      },
    };

    return this.prisma.webhookEvent.create({
      data: {
        tenantId: channel.tenantId,
        channelId: channel.id,
        direction: WebhookDirection.INBOUND,
        eventName,
        status: WebhookEventStatus.SUCCESS,
        payloadJson
      },
    });
  }

  private validateWebhookSecret(
    expectedSecret: string | null,
    headers: Record<string, string | string[] | undefined>,
  ) {
    if (!expectedSecret) {
      return;
    }

    const incomingSecret = this.getSingleHeaderValue(headers["x-webhook-secret"]);

    if (!incomingSecret) {
      throw new ForbiddenException("Missing webhook secret");
    }

    if (!this.safeCompare(incomingSecret, expectedSecret)) {
      throw new ForbiddenException("Invalid webhook signature");
    }
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

  private toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private toOptionalPrismaJson(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value as Prisma.InputJsonValue;
  }
}