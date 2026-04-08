import { IsObject, IsOptional, IsString } from 'class-validator';

export class RespondWebhookDto {
  @IsOptional()
  @IsString()
  status?: 'SUCCESS' | 'FAILED';

  @IsOptional()
  @IsObject()
  responseJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}