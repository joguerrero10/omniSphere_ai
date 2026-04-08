import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly registry: Registry;

  public readonly llmRequestsTotal: Counter<string>;
  public readonly llmLatencyMs: Histogram<string>;
  public readonly llmCacheHitsTotal: Counter<string>;
  public readonly llmCacheMissesTotal: Counter<string>;
  public readonly llmFailuresTotal: Counter<string>;
  public readonly llmTokensTotal: Counter<string>;
  public readonly queueJobsActive: Gauge<string>;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.llmRequestsTotal = new Counter({
      name: 'llm_requests_total',
      help: 'Total de requests al LLM',
      labelNames: ['provider', 'model', 'task'],
      registers: [this.registry],
    });

    this.llmLatencyMs = new Histogram({
      name: 'llm_latency_ms',
      help: 'Latencia de requests LLM en ms',
      labelNames: ['provider', 'model', 'task'],
      buckets: [50, 100, 250, 500, 1000, 2000, 5000, 10000],
      registers: [this.registry],
    });

    this.llmCacheHitsTotal = new Counter({
      name: 'llm_cache_hits_total',
      help: 'Total de hits del caché',
      labelNames: ['model'],
      registers: [this.registry],
    });

    this.llmCacheMissesTotal = new Counter({
      name: 'llm_cache_misses_total',
      help: 'Total de misses del caché',
      labelNames: ['model'],
      registers: [this.registry],
    });

    this.llmFailuresTotal = new Counter({
      name: 'llm_failures_total',
      help: 'Total de fallos LLM',
      labelNames: ['provider', 'model', 'reason'],
      registers: [this.registry],
    });

    this.llmTokensTotal = new Counter({
      name: 'llm_tokens_total',
      help: 'Tokens consumidos',
      labelNames: ['provider', 'model', 'type'],
      registers: [this.registry],
    });

    this.queueJobsActive = new Gauge({
      name: 'queue_jobs_active',
      help: 'Jobs activos en cola',
      labelNames: ['queue'],
      registers: [this.registry],
    });
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }
}