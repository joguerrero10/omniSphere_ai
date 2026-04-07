import { FlowEdgeConditionType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateFlowEdgeDto {
  @IsUUID()
  sourceNodeId: string;

  @IsUUID()
  targetNodeId: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsEnum(FlowEdgeConditionType)
  conditionType?: FlowEdgeConditionType;

  @IsOptional()
  @IsString()
  intentName?: string;

  @IsOptional()
  @IsBoolean()
  isFallback?: boolean;
}