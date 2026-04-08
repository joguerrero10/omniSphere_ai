import { Injectable } from '@nestjs/common';
import { LlmRequest } from '../interfaces/llm-request.interface';
import { LlmResponse } from '../interfaces/llm-response.interface';
import { LlmCacheService } from './llm-cache.service';
import { LlmResilienceService } from './llm-resilience.service';
import { LlmRouterService } from './llm-router.service';

@Injectable()
export class LlmClientService {
  constructor(
    private readonly router: LlmRouterService,
    private readonly cache: LlmCacheService,
    private readonly resilience: LlmResilienceService,
  ) { }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const route = this.router.decide(req);
    const cacheKey = this.cache.buildKey(req, route.model);

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const response = await this.resilience.execute(
      `${route.provider}:${route.model}`,
      async () => {
        return this.callProvider(route.provider, route.model, req);
      },
      3,
    );

    await this.cache.set(cacheKey, response, 300);
    return response;
  }

  private async callProvider(
    provider: 'openai' | 'anthropic' | 'local' | 'groq',
    model: string,
    req: LlmRequest,
  ): Promise<LlmResponse> {
    if (provider === 'local') {
      return {
        text: 'LOCAL_CLASSIFIER_RESULT',
        model,
      };
    }

    // Aquí conectas tu SDK real
    // Ejemplo conceptual
    return {
      text: `Respuesta generada por ${model} para tarea ${req.taskType}`,
      model,
      usage: {
        promptTokens: 120,
        completionTokens: 35,
        totalTokens: 155,
      },
    };
  }
}