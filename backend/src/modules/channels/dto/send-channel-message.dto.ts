import { IsObject, IsOptional, IsString } from 'class-validator';

export class SendChannelMessageDto {
  @IsString()
  to: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}