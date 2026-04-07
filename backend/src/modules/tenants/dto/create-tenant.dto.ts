import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { TenantPlan } from '../enum/tenant-plan';

export class CreateTenantDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsEnum(TenantPlan)
  plan: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}