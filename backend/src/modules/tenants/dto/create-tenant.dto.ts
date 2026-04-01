import { IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  plan: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}