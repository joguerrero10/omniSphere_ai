import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  CompleteProviderRequest,
  ExternalLlmProvider,
  ProviderResult,
} from '../interfaces/llm-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { GroqProvider } from './groq.provider';
import { OpenAiProvider } from './openai.provider';

@Injectable()
export class MultiProviderLlmService {
  constructor(
    private readonly groqProvider: GroqProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly anthropicProvider: AnthropicProvider,
  ) { }

  async complete(
    req: CompleteProviderRequest & {
      provider: ExternalLlmProvider;
      fallbackChain?: ExternalLlmProvider[];
    },
  ): Promise<ProviderResult> {
    const providers = [req.provider, ...(req.fallbackChain ?? [])];
    const tried = new Set<ExternalLlmProvider>();
    let lastError: unknown;

    for (const provider of providers) {
      if (tried.has(provider)) {
        continue;
      }

      tried.add(provider);

      try {
        return await this.getProvider(provider).complete(req);
      } catch (error) {
        lastError = error;
      }
    }

    throw new ServiceUnavailableException(
      `Todos los proveedores fallaron: ${[...tried].join(', ')}`,
      { cause: lastError as Error },
    );
  }

  private getProvider(provider: ExternalLlmProvider) {
    switch (provider) {
      case 'groq':
        return this.groqProvider;
      case 'openai':
        return this.openAiProvider;
      case 'anthropic':
        return this.anthropicProvider;
      default:
        throw new ServiceUnavailableException(
          `Proveedor no soportado: ${provider}`,
        );
    }
  }
}