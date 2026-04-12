export interface LlmResponse {
  text: string;
  model: string;
  cached?: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: any;
}