export type ExternalLlmProvider = 'groq' | 'openai' | 'anthropic' | 'local';
export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompleteProviderRequest {
  prompt: string;
  model: string;
  systemPrompt?: string | null;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
  messages?: ChatCompletionMessage[];
}

export interface ProviderUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ProviderResult {
  text: string;
  model: string;
  provider: ExternalLlmProvider;
  usage?: ProviderUsage;
  raw?: unknown;
}

export interface ExternalLlmAdapter {
  readonly providerName: ExternalLlmProvider;
  complete(req: CompleteProviderRequest): Promise<ProviderResult>;
}
