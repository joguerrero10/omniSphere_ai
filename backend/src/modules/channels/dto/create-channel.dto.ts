import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum ChannelType {
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  WEBCHAT = 'WEBCHAT',
  INSTAGRAM = 'INSTAGRAM',
}

export class CreateChannelDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(ChannelType)
  type!: ChannelType;

  @IsOptional()
  @IsUUID()
  flowId?: string | null;

  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsString()
  botId?: string | null
}