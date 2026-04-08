import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';

export interface CachedLlmResponse {
  text: string;
  model: string;
  usage?: Record<string, any>;
  createdAt: string;
}

@Injectable()
export class LlmCacheService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) { }

  private buildKey(payload: Record<string, any>): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return `llm:cache:${hash}`;
  }

  async get(payload: Record<string, any>): Promise<CachedLlmResponse | null> {
    const key = this.buildKey(payload);
    const raw = await this.redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async set(
    payload: Record<string, any>,
    value: CachedLlmResponse,
    ttlSeconds = 300,
  ): Promise<void> {
    const key = this.buildKey(payload);
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }
}