import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { ClassifyTextDto } from "./dto/classify-text.dto";
import { CreateEntityValueDto } from "./dto/create-entity-value.dto";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { CreateIntentEntityDto } from "./dto/create-intent-entity.dto";
import { CreateIntentDto } from "./dto/create-intent.dto";
import { CreateUtteranceDto } from "./dto/create-utterance.dto";
import { FeedbackDto } from "./dto/feedback.dto";
import { InferDto } from "./dto/infer.dto";
import { InitSettingsDto } from "./dto/init-settings.dto";
import { StreamPromptQueryDto } from "./dto/stream-prompt-query.dto";
import { TrainDto } from "./dto/train.dto";
import { NluService } from "./nlu.service";
import { HybridClassifierService } from "./providers/hybrid-classifier.service";
import { LlmClientService } from "./providers/llm-client.service";
import { StreamService } from "./providers/stream.service";

@UseGuards(JwtAuthGuard)
@Controller("nlu")
export class NluController {
  constructor(
    private readonly nluService: NluService,
    private readonly llmClient: LlmClientService,
    private readonly hybridClassifier: HybridClassifierService,
    private readonly streamService: StreamService,
  ) { }

  @Post("tenants/:tenantId/intents")
  createIntent(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("tenantId") tenantId: string,
    @Body() dto: CreateIntentDto,
  ) {
    this.assertTenantAccess(actor, tenantId);
    return this.nluService.createIntent(tenantId, dto);
  }

  @Get("tenants/:tenantId/intents")
  getIntents(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("tenantId") tenantId: string,
  ) {
    this.assertTenantAccess(actor, tenantId);
    return this.nluService.findIntentsByTenant(tenantId);
  }

  @Post("tenants/:tenantId/utterances")
  createUtterance(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("tenantId") tenantId: string,
    @Body() dto: CreateUtteranceDto,
  ) {
    this.assertTenantAccess(actor, tenantId);
    return this.nluService.createUtterance(tenantId, dto);
  }

  @Post("tenants/:tenantId/entities")
  createEntity(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("tenantId") tenantId: string,
    @Body() dto: CreateEntityDto,
  ) {
    this.assertTenantAccess(actor, tenantId);
    return this.nluService.createEntity(tenantId, dto);
  }

  @Get("tenants/:tenantId/entities")
  getEntities(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("tenantId") tenantId: string,
  ) {
    this.assertTenantAccess(actor, tenantId);
    return this.nluService.findEntitiesByTenant(tenantId);
  }

  @Post("entity-values")
  createEntityValue(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateEntityValueDto,
  ) {
    return this.nluService.createEntityValue(actor.tenantId, dto);
  }

  @Post("intent-entities")
  createIntentEntity(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateIntentEntityDto,
  ) {
    return this.nluService.createIntentEntity(actor.tenantId, dto);
  }

  @Post("tenants/:tenantId/settings/init")
  initSettings(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("tenantId") tenantId: string,
    @Body() dto: InitSettingsDto,
  ) {
    this.assertTenantAccess(actor, tenantId);
    return this.nluService.initSettings(tenantId, dto.defaultLanguage ?? "es");
  }

  @Post("train")
  train(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: TrainDto,
  ) {
    return this.nluService.train(actor.tenantId, dto);
  }

  @Post("infer")
  infer(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: InferDto,
  ) {
    return this.nluService.infer(actor.tenantId, dto);
  }

  @Post("feedback")
  feedback(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: FeedbackDto,
  ) {
    return this.nluService.saveFeedback(actor.tenantId, dto);
  }

  @Post("classify")
  async classify(@Body() dto: ClassifyTextDto) {
    return this.hybridClassifier.classify(dto.text);
  }

  @Sse("stream")
  async stream(
    @Query() query: StreamPromptQueryDto,
  ): Promise<Observable<MessageEvent>> {
    const result = await this.llmClient.complete({
      prompt: query.prompt,
      taskType: "chat",
      stream: true,
    });

    return this.streamService.streamText(result.text);
  }

  private assertTenantAccess(actor: CurrentUserPayload, tenantId: string) {
    if (actor.tenantId !== tenantId) {
      throw new ForbiddenException("You cannot access another tenant");
    }
  }
}