import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { LlmRequest } from '../interfaces/llm-request.interface';
import { LlmResponse } from '../interfaces/llm-response.interface';

@Injectable()
export class LlmCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) { }

  buildKey(req: LlmRequest, model: string): string {
    const payload = JSON.stringify({
      model,
      taskType: req.taskType,
      prompt: req.prompt,
      temperature: req.temperature ?? 0,
      maxTokens: req.maxTokens ?? 512,
    });

    return 'llm:' + crypto.createHash('sha256').update(payload).digest('hex');
  }

  async get(key: string): Promise<LlmResponse | null> {
    return (await this.cache.get<LlmResponse>(key)) ?? null;
  }

  async set(key: string, value: LlmResponse, ttlSeconds = 300): Promise<void> {
    await this.cache.set(key, value, ttlSeconds * 1000);
  }
}