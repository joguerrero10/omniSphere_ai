import { Injectable } from '@nestjs/common';
import {
  CompleteProviderRequest,
  LlmProvider,
  ProviderResult,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAiProvider implements LlmProvider {
  async complete(req: CompleteProviderRequest): Promise<ProviderResult> {
    // Aquí luego conectas el SDK real de OpenAI
    return {
      text: `Respuesta desde OpenAI con modelo ${req.model}`,
      model: req.model,
      provider: 'openai',
      usage: {
        promptTokens: 100,
        completionTokens: 30,
        totalTokens: 130,
      },
    };
  }
}