export interface MissingEntity {
  entityCode: string;
  entityName: string;
  promptIfMissing?: string | null;
}

export interface InferenceResult {
  tenantId: string;
  intentCode: string | null;
  intentName: string | null;
  confidence: number;
  entities: Record<string, any>;
  missingEntities: MissingEntity[];
  fallbackUsed: boolean;
  llmResponse: string | null;
  requiresHandoff: boolean;
  modelVersionUsed: string | null;
  inferenceLogId: string;
}
