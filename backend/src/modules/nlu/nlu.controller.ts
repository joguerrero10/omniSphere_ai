import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Sse,
  UseGuards
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CreateEntityValueDto } from './dto/create-entity-value.dto';
import { CreateEntityDto } from './dto/create-entity.dto';
import { CreateIntentEntityDto } from './dto/create-intent-entity.dto';
import { CreateIntentDto } from './dto/create-intent.dto';
import { CreateUtteranceDto } from './dto/create-utterance.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { InitSettingsDto } from './dto/init-settings.dto';
import { TrainDto } from './dto/train.dto';
import { NluService } from './nlu.service';
import { HybridClassifierService } from './providers/hybrid-classifier.service';
import { LlmClientService } from './providers/llm-client.service';
import { StreamService } from './providers/stream.service';
@UseGuards(JwtAuthGuard)
@Controller('nlu')
export class NluController {
  constructor(private readonly nluService: NluService, private readonly llmClient: LlmClientService,
    private readonly hybridClassifier: HybridClassifierService,
    private readonly streamService: StreamService,) { }

  @Post('tenants/:tenantId/intents')
  createIntent(@Param('tenantId') tenantId: string, @Body() dto: CreateIntentDto) {
    return this.nluService.createIntent(tenantId, dto);
  }

  @Get('tenants/:tenantId/intents')
  getIntents(@Param('tenantId') tenantId: string) {
    return this.nluService.findIntentsByTenant(tenantId);
  }

  @Post('tenants/:tenantId/utterances')
  createUtterance(@Param('tenantId') tenantId: string, @Body() dto: CreateUtteranceDto) {
    return this.nluService.createUtterance(tenantId, dto);
  }

  @Post('tenants/:tenantId/entities')
  createEntity(@Param('tenantId') tenantId: string, @Body() dto: CreateEntityDto) {
    return this.nluService.createEntity(tenantId, dto);
  }

  @Get('tenants/:tenantId/entities')
  getEntities(@Param('tenantId') tenantId: string) {
    return this.nluService.findEntitiesByTenant(tenantId);
  }

  @Post('entity-values')
  createEntityValue(@Body() dto: CreateEntityValueDto) {
    return this.nluService.createEntityValue(dto);
  }

  @Post('intent-entities')
  createIntentEntity(@Body() dto: CreateIntentEntityDto) {
    return this.nluService.createIntentEntity(dto);
  }

  @Post('tenants/:tenantId/settings/init')
  initSettings(
    @Param('tenantId') tenantId: string,
    @Body() dto: InitSettingsDto,
  ) {
    return this.nluService.initSettings(tenantId, dto.defaultLanguage ?? 'es');
  }

  @Post('train')
  train(@Body() dto: TrainDto) {
    return this.nluService.train(dto);
  }

  @Post('infer')
  async infer(@Body() body: { prompt: string }) {
    return this.llmClient.complete({
      prompt: body.prompt,
      taskType: 'generation',
    });
  }

  @Post('feedback')
  feedback(@Body() dto: FeedbackDto) {
    return this.nluService.saveFeedback(dto);
  }

  @Post('classify')
  async classify(@Body() body: { text: string }) {
    return this.hybridClassifier.classify(body.text);
  }

  @Sse('stream')
  async stream(): Promise<Observable<MessageEvent>> {
    const result = await this.llmClient.complete({
      prompt: 'Genera una respuesta en streaming',
      taskType: 'chat',
      stream: true,
    });

    return this.streamService.streamText(result.text);
  }
}
