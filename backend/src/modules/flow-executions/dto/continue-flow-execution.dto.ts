import { IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class ContinueFlowExecutionDto {
  @IsUUID()
  executionId: string;

  @IsOptional()
  @IsString()
  inputText?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
