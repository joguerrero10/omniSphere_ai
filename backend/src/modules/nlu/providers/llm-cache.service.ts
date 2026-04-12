import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { LlmRequest } from '../interfaces/llm-request.interface';
import { LlmResponse } from '../interfaces/llm-response.interface';

@Injectable()
export class LlmCacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }

  buildPayload(req: LlmRequest, provider: string, model: string) {
    return {
      provider,
      model,
      taskType: req.taskType,
      prompt: req.prompt,
      temperature: req.temperature ?? 0,
      maxTokens: req.maxTokens ?? 512,
      metadata: req.metadata ?? {},
    };
  }

  buildKey(payload: Record<string, unknown>): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return `llm:cache:${hash}`;
  }

  async get(payload: Record<string, unknown>): Promise<LlmResponse | null> {
    const raw = await this.redis.get(this.buildKey(payload));
    return raw ? (JSON.parse(raw) as LlmResponse) : null;
  }

  async set(
    payload: Record<string, unknown>,
    value: LlmResponse,
    ttlSeconds = 300,
  ): Promise<void> {
    await this.redis.set(this.buildKey(payload), JSON.stringify(value), 'EX', ttlSeconds);
  }
}
