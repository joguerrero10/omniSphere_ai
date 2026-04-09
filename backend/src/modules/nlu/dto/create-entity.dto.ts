import { NluEntityType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateEntityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsEnum(NluEntityType)
  entityType: NluEntityType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  validationRule?: string;
}