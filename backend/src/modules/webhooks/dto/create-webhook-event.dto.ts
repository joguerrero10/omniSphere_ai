import { IsObject, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateWebhookEventDto {
  @IsString()
  tenantId: string;

  @IsString()
  eventName: string;

  @IsString()
  direction: 'INBOUND' | 'OUTBOUND';

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
  payloadJson: Record<string, any>;
}