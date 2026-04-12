import { IsOptional, IsString } from 'class-validator';

export class InitSettingsDto {
  @IsOptional()
  @IsString()
  defaultLanguage?: string = 'es';
}
