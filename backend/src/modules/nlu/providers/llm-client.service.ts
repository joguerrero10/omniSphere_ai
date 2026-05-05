import { Injectable } from '@nestjs/common';
import { LlmRequest } from '../interfaces/llm-request.interface';
import { LlmResponse } from '../interfaces/llm-response.interface';
import { MetricsService } from '../metrics/metrics.service';
import { LlmCacheService } from './llm-cache.service';
import { LlmResilienceService } from './llm-resilience.service';
import { LlmRouterService } from './llm-router.service';
import { MultiProviderLlmService } from './multi-provider-llm.service';

@Injectable()
export class LlmClientService {
  constructor(
    private readonly router: LlmRouterService,
    private readonly cache: LlmCacheService,
    private readonly resilience: LlmResilienceService,
    private readonly multiProvider: MultiProviderLlmService,
    private readonly metrics: MetricsService,
  ) { }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const route = this.router.decide(req);

    if (route.provider === 'local') {
      return { text: 'LOCAL_CLASSIFIER_RESULT', model: route.model };
    }

    const cachePayload = this.cache.buildPayload(req, route.provider, route.model);
    const cached = await this.cache.get(cachePayload);

    if (cached) {
      this.metrics.llmCacheHitsTotal.inc({ model: cached.model });
      return { ...cached, cached: true };
    }

    this.metrics.llmCacheMissesTotal.inc({ model: route.model });

    const start = Date.now();

    const result = await this.resilience.execute(
      `${route.provider}:${route.model}`,
      async () =>
        this.multiProvider.complete({
          provider: route.provider,
          fallbackChain: route.fallbackChain,
          prompt: req.prompt,
          model: route.model,
          systemPrompt: typeof req.metadata?.systemPrompt === 'string'
            ? req.metadata.systemPrompt
            : null,
          temperature: req.temperature,
          maxTokens: req.maxTokens,
          stream: req.stream,
          metadata: req.metadata,
        }),
      3,
    );

    const latencyMs = Date.now() - start;

    const response: LlmResponse = {
      text: result.text,
      model: result.model,
      usage: result.usage,
      raw: result.raw,
    };

    this.metrics.llmRequestsTotal.inc({
      provider: result.provider,
      model: result.model,
      task: req.taskType,
    });

    this.metrics.llmLatencyMs.observe(
      { provider: result.provider, model: result.model, task: req.taskType },
      latencyMs,
    );

    if (result.usage?.totalTokens) {
      this.metrics.llmTokensTotal.inc(
        {
          provider: result.provider,
          model: result.model,
          type: 'total',
        },
        result.usage.totalTokens,
      );
    }

    await this.cache.set(cachePayload, response, 300);
    return response;
  }
}
