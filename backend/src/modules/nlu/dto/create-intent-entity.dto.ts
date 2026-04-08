import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateIntentEntityDto {
  @IsString()
  intentId: string;

  @IsString()
  entityId: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @IsOptional()
  @IsString()
  promptIfMissing?: string;

  @IsOptional()
  @IsInt()
  validationOrder?: number = 1;
}
