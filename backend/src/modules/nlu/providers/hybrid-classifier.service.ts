import { Injectable } from '@nestjs/common';
import { ClassificationResult } from '../interfaces/classification-result.interface';
import { LlmClientService } from './llm-client.service';
import { LocalMlClassifierService } from './local-ml-classifier.service';

@Injectable()
export class HybridClassifierService {
  private readonly threshold = 0.75;

  constructor(
    private readonly localClassifier: LocalMlClassifierService,
    private readonly llmClient: LlmClientService,
  ) { }

  async classify(text: string): Promise<ClassificationResult> {
    const local = await this.localClassifier.classify(text);

    if (local.confidence >= this.threshold && local.label !== 'unknown') {
      return local;
    }

    const llm = await this.llmClient.complete({
      prompt: `
Clasifica el siguiente texto en una sola categoría:
[sales, support, billing, complaint, general]

Texto:
"${text}"

Responde SOLO con JSON:
{"label":"...", "confidence":0.0}
      `,
      taskType: 'classification',
      temperature: 0,
      maxTokens: 80,
    });

    let parsed: { label: string; confidence: number };

    try {
      parsed = JSON.parse(llm.text);
    } catch {
      parsed = { label: 'general', confidence: 0.6 };
    }

    return {
      label: parsed.label,
      confidence: parsed.confidence,
      source: 'llm-fallback',
      metadata: { model: llm.model },
    };
  }
}