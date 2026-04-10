import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendChannelMessageDto {
  @IsString()
  to!: string;

  @IsString()
  @MaxLength(4096)
  message!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}