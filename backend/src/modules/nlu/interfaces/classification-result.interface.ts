export interface ClassificationResult {
  label: string;
  confidence: number;
  source: 'local-ml' | 'llm-fallback';
  metadata?: Record<string, any>;
}