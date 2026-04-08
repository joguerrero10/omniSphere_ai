import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ChannelType, CreateChannelDto } from './create-channel.dto';

export enum ChannelStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateChannelDto extends PartialType(CreateChannelDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @IsOptional()
  @IsEnum(ChannelStatus)
  status?: ChannelStatus;

  @IsOptional()
  @IsUUID()
  flowId?: string | null;

  @IsOptional()
  @IsObject()
  configJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}