import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class ExecuteFlowDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  flowId: string;

  @IsOptional()
  @IsString()
  channel?: string; // whatsapp, webchat, instagram, etc.

  @IsOptional()
  @IsString()
  userId?: string; // usuario final o externalUserId

  @IsOptional()
  @IsString()
  sessionId?: string; // conversación/sesión externa

  @IsOptional()
  @IsString()
  inputText?: string; // mensaje entrante del usuario

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>; // input estructurado

  @IsOptional()
  @IsArray()
  triggeredByNodeIds?: string[]; // opcional para debug o reanudación
}
