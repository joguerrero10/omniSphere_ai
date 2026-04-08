import { IsOptional, IsString } from 'class-validator';

export class InferDto {
  @IsString()
  tenantId: string;

  @IsString()
  messageText: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  language?: string = 'es';

  @IsOptional()
  @IsString()
  channel?: string = 'WEBCHAT';

  @IsString()
  prompt?: string;

  @IsOptional()
  stream?: boolean;
}
