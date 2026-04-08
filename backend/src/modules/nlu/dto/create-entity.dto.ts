import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum EntityTypeDto {
  REGEX = 'REGEX',
  DICTIONARY = 'DICTIONARY',
  SYSTEM = 'SYSTEM',
}

export class CreateEntityDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(EntityTypeDto)
  entityType: EntityTypeDto;

  @IsOptional()
  @IsString()
  validationRule?: string;
}
