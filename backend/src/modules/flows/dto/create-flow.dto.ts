import { FlowStatus } from "@prisma/client";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateFlowDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FlowStatus)
  status?: FlowStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
