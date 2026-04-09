import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class InferDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  messageText: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  language?: string = "es";

  @IsOptional()
  @IsString()
  channel?: string = "WEBCHAT";

  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}