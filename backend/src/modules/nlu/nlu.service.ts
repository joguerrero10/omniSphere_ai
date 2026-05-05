import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NluEntityType, NluModelStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateEntityValueDto } from "./dto/create-entity-value.dto";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { CreateIntentEntityDto } from "./dto/create-intent-entity.dto";
import { CreateIntentDto } from "./dto/create-intent.dto";
import { CreateUtteranceDto } from "./dto/create-utterance.dto";
import { FeedbackDto } from "./dto/feedback.dto";
import { InferDto } from "./dto/infer.dto";
import { NluTrainTrigger, TrainDto } from "./dto/train.dto";
import { InferenceResult } from "./interfaces/inference-result.interface";
import { LlmProvider } from "./providers/llm.provider";

type ExtractedEntities = Record<string, string>;

type ClassifierItem = {
  intentCode: string;
  intentName: string;
  examples: string[];
  vocabulary: string[];
};

type TenantModelRegistry = {
  version: string;
  trainedAt: string;
  classifier: ClassifierItem[];
  metrics: unknown;
};

@Injectable()
export class NluService {
  private readonly registry = new Map<string, TenantModelRegistry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmProvider: LlmProvider,
    private readonly configService: ConfigService,
  ) { }

  async createIntent(tenantId: string, dto: CreateIntentDto) {
    await this.ensureTenantExists(tenantId);

    return this.prisma.nluIntent.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        fallbackResponse: dto.fallbackResponse,
      },
    });
  }

  async createUtterance(tenantId: string, dto: CreateUtteranceDto) {
    await this.ensureTenantExists(tenantId);
    await this.ensureIntentBelongsToTenant(dto.intentId, tenantId);

    const created = await this.prisma.nluUtterance.create({
      data: {
        tenantId,
        intentId: dto.intentId,
        text: dto.text,
        language: dto.language ?? "es",
        source: dto.source ?? "manual",
        createdBy: dto.createdBy,
      },
    });

    const settings = await this.prisma.tenantNluSettings.findUnique({
      where: { tenantId },
    });

    if (settings?.enableOnlineTraining) {
      await this.train(tenantId, {
        createdBy: dto.createdBy || "system",
        triggerType: NluTrainTrigger.AUTO,
      });
    }

    return created;
  }

  async createEntity(tenantId: string, dto: CreateEntityDto) {
    await this.ensureTenantExists(tenantId);

    return this.prisma.nluEntity.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        entityType: dto.entityType,
        validationRule: dto.validationRule,
      },
    });
  }

  async createEntityValue(tenantId: string, dto: CreateEntityValueDto) {
    const entity = await this.prisma.nluEntity.findUnique({
      where: { id: dto.entityId },
    });

    if (!entity || entity.tenantId !== tenantId) {
      throw new NotFoundException("Entity not found");
    }

    return this.prisma.nluEntityValue.create({
      data: {
        entityId: dto.entityId,
        canonicalValue: dto.canonicalValue,
        synonyms: dto.synonyms ?? [],
        language: dto.language ?? "es",
      },
    });
  }

  async createIntentEntity(tenantId: string, dto: CreateIntentEntityDto) {
    const intent = await this.prisma.nluIntent.findUnique({
      where: { id: dto.intentId },
    });

    const entity = await this.prisma.nluEntity.findUnique({
      where: { id: dto.entityId },
    });

    if (!intent || intent.tenantId !== tenantId) {
      throw new NotFoundException("Intent not found");
    }

    if (!entity || entity.tenantId !== tenantId) {
      throw new NotFoundException("Entity not found");
    }

    if (intent.tenantId !== entity.tenantId) {
      throw new BadRequestException("Intent and Entity must belong to the same tenant");
    }

    return this.prisma.nluIntentEntity.create({
      data: {
        intentId: dto.intentId,
        entityId: dto.entityId,
        isRequired: dto.isRequired ?? false,
        promptIfMissing: dto.promptIfMissing,
        validationOrder: dto.validationOrder ?? 1,
      },
    });
  }

  async initSettings(tenantId: string, defaultLanguage = "es") {
    await this.ensureTenantExists(tenantId);

    const existing = await this.prisma.tenantNluSettings.findUnique({
      where: { tenantId },
    });

    if (existing) {
      return existing;
    }

    await this.prisma.nluModelConfig.create({
      data: {
        tenantId,
        provider: this.configService.get<string>("DEFAULT_LLM_PROVIDER", "openai"),
        modelName: this.configService.get<string>("DEFAULT_LLM_MODEL", "gpt-4o-mini"),
        isDefault: true,
      },
    });

    return this.prisma.tenantNluSettings.create({
      data: {
        tenantId,
        defaultLanguage,
      },
    });
  }

  async train(tenantId: string, dto: TrainDto) {
    const { createdBy = "system", triggerType = NluTrainTrigger.MANUAL } = dto;

    await this.ensureTenantExists(tenantId);

    const utterances = await this.prisma.nluUtterance.findMany({
      where: {
        tenantId,
        isActive: true,
        intent: { isActive: true },
      },
      include: {
        intent: true,
      },
    });

    if (utterances.length < 2) {
      throw new BadRequestException("Not enough utterances to train");
    }

    const uniqueLabels = [...new Set(utterances.map((u) => u.intent.code))];
    if (uniqueLabels.length < 2) {
      throw new BadRequestException("At least 2 distinct intents are required for training");
    }

    const version = await this.prisma.nluModelVersion.create({
      data: {
        tenantId,
        version: `v${Date.now()}`,
        status: NluModelStatus.TRAINING,
        trainingStartedAt: new Date(),
        createdBy,
      },
    });

    const trainingJob = await this.prisma.nluTrainingJob.create({
      data: {
        tenantId,
        modelVersionId: version.id,
        triggerType,
        datasetSize: utterances.length,
        status: "running",
        startedAt: new Date(),
      },
    });

    const trainedData = this.buildSimpleClassifier(utterances);

    this.registry.set(tenantId, {
      version: version.version,
      trainedAt: new Date().toISOString(),
      classifier: trainedData,
      metrics: {
        datasetSize: utterances.length,
        labels: uniqueLabels,
      },
    });

    await this.prisma.nluModelVersion.updateMany({
      where: {
        tenantId,
        id: { not: version.id },
        status: NluModelStatus.ACTIVE,
      },
      data: {
        status: NluModelStatus.DEPRECATED,
      },
    });

    await this.prisma.nluModelVersion.update({
      where: { id: version.id },
      data: {
        status: NluModelStatus.ACTIVE,
        trainingFinishedAt: new Date(),
        metricsJson: {
          datasetSize: utterances.length,
          labels: uniqueLabels,
        },
      },
    });

    await this.prisma.nluTrainingJob.update({
      where: { id: trainingJob.id },
      data: {
        status: "completed",
        logs: "Entrenamiento completado",
        finishedAt: new Date(),
      },
    });

    return {
      tenantId,
      version: version.version,
      metrics: {
        datasetSize: utterances.length,
        labels: uniqueLabels,
      },
    };
  }

  async infer(tenantId: string, dto: InferDto): Promise<InferenceResult> {
    const start = Date.now();
    const { messageText, conversationId, messageId } = dto;

    await this.ensureTenantExists(tenantId);

    const settings = await this.prisma.tenantNluSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new BadRequestException("TenantNluSettings not configured. Call /settings/init first");
    }

    const modelConfig = await this.prisma.nluModelConfig.findFirst({
      where: { tenantId, isDefault: true },
    });

    if (!this.registry.has(tenantId)) {
      await this.tryLoadLatestModel(tenantId);
    }

    if (!this.registry.has(tenantId)) {
      throw new BadRequestException("No model in memory for this tenant. Call /train first");
    }

    const trained = this.registry.get(tenantId);
    if (!trained) {
      throw new BadRequestException("No model loaded for this tenant");
    }

    const prediction = this.predictIntent(trained.classifier, messageText);

    const intent = prediction.intentCode
      ? await this.prisma.nluIntent.findFirst({
        where: {
          tenantId,
          code: prediction.intentCode,
          isActive: true,
        },
      })
      : null;

    const entities = settings.enableEntityExtraction
      ? await this.extractEntities(tenantId, messageText)
      : {};

    const missingEntities = intent
      ? await this.resolveMissingEntities(intent.id, entities)
      : [];

    let fallbackUsed = false;
    let llmResponse: string | null = null;
    const requiresHandoff = prediction.confidence < settings.humanHandoffThreshold;

    if (
      prediction.confidence < settings.minConfidence &&
      settings.enableLlmFallback &&
      modelConfig
    ) {
      fallbackUsed = true;
      llmResponse = await this.llmProvider.generate({
        provider: modelConfig.provider,
        modelName: modelConfig.modelName,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        systemPrompt: modelConfig.systemPrompt,
        prompt: `User message: ${messageText}
Predicted intent: ${prediction.intentCode || "UNKNOWN"}
Confidence: ${prediction.confidence}
Entities: ${JSON.stringify(entities)}
Respond with a helpful answer and a brief interpretation of the message.`,
      });
    }

    const latencyMs = Date.now() - start;

    const log = await this.prisma.nluInferenceLog.create({
      data: {
        tenantId,
        conversationId,
        messageId,
        inputText: messageText,
        detectedIntentId: intent?.id,
        confidenceScore: prediction.confidence,
        entitiesJson: {
          values: entities,
          trace: {
            provider: modelConfig?.provider ?? null,
            latencyMs,
            fallbackUsed,
          },
        },
        modelUsed: trained.version,
        latencyMs,
        fallbackUsed,
      },
    });

    return {
      tenantId,
      intentCode: intent?.code || null,
      intentName: intent?.name || null,
      confidence: prediction.confidence,
      entities,
      missingEntities,
      fallbackUsed,
      llmResponse,
      requiresHandoff,
      modelVersionUsed: trained.version,
      inferenceLogId: log.id,
    };
  }

  async saveFeedback(tenantId: string, dto: FeedbackDto) {
    await this.ensureTenantExists(tenantId);

    return this.prisma.nluFeedback.create({
      data: {
        tenantId,
        inferenceLogId: dto.inferenceLogId,
        wasCorrect: dto.wasCorrect,
        correctIntentId: dto.correctIntentId,
        reviewedBy: dto.reviewedBy,
        comments: dto.comments,
      },
    });
  }

  async findIntentsByTenant(tenantId: string) {
    return this.prisma.nluIntent.findMany({
      where: { tenantId },
      include: { utterances: true, intentEntities: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findEntitiesByTenant(tenantId: string) {
    return this.prisma.nluEntity.findMany({
      where: { tenantId },
      include: { values: true, intentEntities: true },
      orderBy: { createdAt: "desc" },
    });
  }

  private async resolveMissingEntities(intentId: string, extracted: ExtractedEntities) {
    const required = await this.prisma.nluIntentEntity.findMany({
      where: {
        intentId,
        isRequired: true,
      },
      include: { entity: true },
      orderBy: { validationOrder: "asc" },
    });

    return required
      .filter((item) => !Object.prototype.hasOwnProperty.call(extracted, item.entity.code))
      .map((item) => ({
        entityCode: item.entity.code,
        entityName: item.entity.name,
        promptIfMissing: item.promptIfMissing,
      }));
  }

  private async extractEntities(tenantId: string, text: string): Promise<ExtractedEntities> {
    const entities = await this.prisma.nluEntity.findMany({
      where: { tenantId, isActive: true },
      include: {
        values: {
          where: { isActive: true },
        },
      },
    });

    const results: ExtractedEntities = {};

    for (const entity of entities) {
      if (entity.entityType === NluEntityType.REGEX && entity.validationRule) {
        const regex = new RegExp(entity.validationRule, "i");
        const match = text.match(regex);
        if (match?.[0]) {
          results[entity.code] = match[0];
        }
      }

      if (entity.entityType === NluEntityType.DICTIONARY) {
        for (const value of entity.values) {
          const synonyms = Array.isArray(value.synonyms)
            ? (value.synonyms as string[])
            : [];

          const variants = [value.canonicalValue, ...synonyms];
          const found = variants.find((term) =>
            text.toLowerCase().includes(String(term).toLowerCase()),
          );

          if (found) {
            results[entity.code] = value.canonicalValue;
            break;
          }
        }
      }
    }

    return results;
  }

  private buildSimpleClassifier(
    utterances: Array<{
      text: string;
      intent: { code: string; name: string };
    }>,
  ): ClassifierItem[] {
    const grouped = utterances.reduce((acc, item) => {
      if (!acc[item.intent.code]) {
        acc[item.intent.code] = {
          intentCode: item.intent.code,
          intentName: item.intent.name,
          examples: [],
          vocabulary: new Set<string>(),
        };
      }

      acc[item.intent.code].examples.push(item.text);
      this.tokenize(item.text).forEach((token) =>
        acc[item.intent.code].vocabulary.add(token),
      );

      return acc;
    }, {} as Record<string, {
      intentCode: string;
      intentName: string;
      examples: string[];
      vocabulary: Set<string>;
    }>);

    return Object.values(grouped).map((item) => ({
      ...item,
      vocabulary: [...item.vocabulary],
    }));
  }

  private predictIntent(classifier: ClassifierItem[], text: string) {
    const tokens = this.tokenize(text);

    let best: {
      intentCode: string | null;
      intentName: string | null;
      confidence: number;
    } = {
      intentCode: null,
      intentName: null,
      confidence: 0,
    };

    for (const item of classifier) {
      const score = this.jaccardSimilarity(tokens, item.vocabulary);
      if (score > best.confidence) {
        best = {
          intentCode: item.intentCode,
          intentName: item.intentName,
          confidence: Number(score.toFixed(4)),
        };
      }
    }

    return best;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9áéíóúñü\s]/gi, " ")
      .split(/\s+/)
      .filter((token) => token && token.length > 1);
  }

  private jaccardSimilarity(tokensA: string[], tokensB: string[]) {
    const a = new Set(tokensA);
    const b = new Set(tokensB);
    const intersection = [...a].filter((x) => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return union === 0 ? 0 : intersection / union;
  }

  private async tryLoadLatestModel(tenantId: string) {
    const latest = await this.prisma.nluModelVersion.findFirst({
      where: {
        tenantId,
        status: NluModelStatus.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      return;
    }

    const utterances = await this.prisma.nluUtterance.findMany({
      where: {
        tenantId,
        isActive: true,
        intent: { isActive: true },
      },
      include: { intent: true },
    });

    if (utterances.length < 2) {
      return;
    }

    this.registry.set(tenantId, {
      version: latest.version,
      trainedAt: latest.updatedAt.toISOString(),
      classifier: this.buildSimpleClassifier(utterances),
      metrics: latest.metricsJson,
    });
  }

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  private async ensureIntentBelongsToTenant(intentId: string, tenantId: string) {
    const intent = await this.prisma.nluIntent.findUnique({
      where: { id: intentId },
    });

    if (!intent || intent.tenantId !== tenantId) {
      throw new BadRequestException("Intent does not belong to this tenant");
    }

    return intent;
  }
}