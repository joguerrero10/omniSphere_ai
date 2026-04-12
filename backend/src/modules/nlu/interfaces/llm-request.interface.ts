export type LlmTaskType =
  | 'classification'
  | 'generation'
  | 'extraction'
  | 'routing'
  | 'chat'
  | 'fallback';

export interface LlmRequest {
  prompt: string;
  taskType: LlmTaskType;
  userId?: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}