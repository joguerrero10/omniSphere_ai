import { WebhookDirection } from "@prisma/client";
import { IsEnum, IsObject, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";

export class CreateWebhookEventDto {
  @IsString()
  eventName!: string;

  @IsEnum(WebhookDirection)
  direction!: WebhookDirection;

  @IsOptional()
  @IsUUID()
  flowExecutionId?: string;

  @IsOptional()
  @IsUUID()
  channelId?: string;

  @IsOptional()
  @IsUrl()
  targetUrl?: string;

  @IsObject()
  payloadJson!: Record<string, unknown>;
}