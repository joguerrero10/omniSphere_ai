import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateEntityValueDto {
  @IsString()
  entityId!: string;

  @IsString()
  canonicalValue!: string;

  @IsOptional()
  @IsArray()
  synonyms?: string[];

  @IsOptional()
  @IsString()
  language?: string = 'es';
}
