import { WebhookEventStatus } from "@prisma/client";
import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export class RespondWebhookDto {
  @IsOptional()
  @IsEnum(WebhookEventStatus)
  status?: WebhookEventStatus;

  @IsOptional()
  @IsObject()
  responseJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}