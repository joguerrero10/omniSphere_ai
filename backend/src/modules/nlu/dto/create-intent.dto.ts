import { IsOptional, IsString } from 'class-validator';

export class CreateIntentDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fallbackResponse?: string;
}
