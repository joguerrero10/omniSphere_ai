import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateFlowEdgeDto {
  @IsString()
  @IsNotEmpty()
  sourceNodeId: string;

  @IsString()
  @IsNotEmpty()
  targetNodeId: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  conditionKey?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
