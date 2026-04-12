import { FlowTriggerType } from "@prisma/client";
import { IsBoolean, IsEnum, IsObject, IsOptional } from "class-validator";

export class CreateFlowTriggerDto {
  @IsEnum(FlowTriggerType)
  type!: FlowTriggerType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
