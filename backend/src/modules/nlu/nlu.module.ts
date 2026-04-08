import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { NluController } from './nlu.controller';
import { NluService } from './nlu.service';
import { HybridClassifierService } from './providers/hybrid-classifier.service';
import { LlmCacheService } from './providers/llm-cache.service';
import { LlmClientService } from './providers/llm-client.service';
import { LlmResilienceService } from './providers/llm-resilience.service';
import { LlmRouterService } from './providers/llm-router.service';
import { LlmProvider } from './providers/llm.provider';
import { LocalMlClassifierService } from './providers/local-ml-classifier.service';
import { StreamService } from './providers/stream.service';

@Module({
  imports: [ConfigModule],
  controllers: [NluController],
  providers: [NluService, LlmProvider, PrismaService,
    LlmRouterService,
    LlmCacheService,
    LlmClientService,
    LlmResilienceService,
    HybridClassifierService,
    LocalMlClassifierService,
    StreamService,],
  exports: [NluService],
})
export class NluModule { }
