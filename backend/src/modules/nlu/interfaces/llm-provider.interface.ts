export interface CompleteProviderRequest {
  prompt: string;
  model: string;
  fallbackModel?: string;
}

export interface ProviderUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ProviderResult {
  text: string;
  model: string;
  provider: string;
  usage?: ProviderUsage;
}

export interface LlmProvider {
  complete(req: CompleteProviderRequest): Promise<ProviderResult>;
}