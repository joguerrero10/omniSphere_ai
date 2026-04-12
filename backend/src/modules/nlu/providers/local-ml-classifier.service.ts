import { Injectable } from '@nestjs/common';
import { ClassificationResult } from '../interfaces/classification-result.interface';

@Injectable()
export class LocalMlClassifierService {
  async classify(text: string): Promise<ClassificationResult> {
    const normalized = text.toLowerCase();

    if (normalized.includes('precio') || normalized.includes('cotización')) {
      return {
        label: 'sales',
        confidence: 0.91,
        source: 'local-ml',
      };
    }

    if (normalized.includes('error') || normalized.includes('fallo')) {
      return {
        label: 'support',
        confidence: 0.82,
        source: 'local-ml',
      };
    }

    return {
      label: 'unknown',
      confidence: 0.42,
      source: 'local-ml',
    };
  }
}