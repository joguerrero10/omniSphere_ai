import { Injectable } from '@nestjs/common';
import {
  CompleteProviderRequest,
  LlmProvider,
  ProviderResult,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class AnthropicProvider implements LlmProvider {
  async complete(req: CompleteProviderRequest): Promise<ProviderResult> {
    // Aquí luego conectas el SDK real de Anthropic
    return {
      text: `Respuesta desde Anthropic con modelo ${req.model}`,
      model: req.model,
      provider: 'anthropic',
      usage: {
        promptTokens: 110,
        completionTokens: 25,
        totalTokens: 135,
      },
    };
  }
}