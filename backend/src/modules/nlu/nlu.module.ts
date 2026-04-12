import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { NluController } from './nlu.controller';
import { NluService } from './nlu.service';
import { NluJobProcessor } from './producer/nlu.job.processor';
import { NluJobProducer } from './producer/producer';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GroqProvider } from './providers/groq.provider';
import { HybridClassifierService } from './providers/hybrid-classifier.service';
import { LlmCacheService } from './providers/llm-cache.service';
import { LlmClientService } from './providers/llm-client.service';
import { LlmResilienceService } from './providers/llm-resilience.service';
import { LlmRouterService } from './providers/llm-router.service';
import { LlmProvider } from './providers/llm.provider';
import { LocalMlClassifierService } from './providers/local-ml-classifier.service';
import { MultiProviderLlmService } from './providers/multi-provider-llm.service';
import { OpenAiProvider } from './providers/openai.provider';
import { StreamService } from './providers/stream.service';

@Module({
  imports: [ConfigModule],
  controllers: [NluController, MetricsController],
  providers: [
    PrismaService,
    NluService,
    MetricsService,
    NluJobProducer,
    NluJobProcessor,
    LlmRouterService,
    LlmCacheService,
    LlmResilienceService,
    MultiProviderLlmService,
    LlmClientService,
    LlmProvider,
    GroqProvider,
    OpenAiProvider,
    AnthropicProvider,
    HybridClassifierService,
    LocalMlClassifierService,
    StreamService,
  ],
  exports: [NluService, LlmClientService, MetricsService],
})
export class NluModule { }
