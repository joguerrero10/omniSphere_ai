import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitInfo {
  state: CircuitState;
  failures: number;
  openedAt?: number;
}

@Injectable()
export class LlmResilienceService {
  private readonly circuits = new Map<string, CircuitInfo>();

  private readonly failureThreshold = 3;
  private readonly recoveryTimeMs = 20_000;

  constructor(private readonly metrics: MetricsService) { }

  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    this.ensureCircuitState(key);

    const circuit = this.circuits.get(key)!;
    if (circuit.state === 'OPEN') {
      throw new ServiceUnavailableException(
        `Circuit breaker OPEN for ${key}`,
      );
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.onSuccess(key);
        return result;
      } catch (error) {
        lastError = error;
        this.onFailure(key);

        if (attempt < maxRetries) {
          const delay = Math.min(500 * 2 ** (attempt - 1), 4000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const { provider, model } = this.parseKey(key);
    this.metrics.llmFailuresTotal.inc({ provider, model });

    throw lastError;
  }

  private parseKey(key: string): { provider: string; model: string } {
    const idx = key.indexOf(':');
    return idx >= 0
      ? { provider: key.slice(0, idx), model: key.slice(idx + 1) }
      : { provider: key, model: 'unknown' };
  }

  private ensureCircuitState(key: string) {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, { state: 'CLOSED', failures: 0 });
      return;
    }

    const circuit = this.circuits.get(key)!;

    if (
      circuit.state === 'OPEN' &&
      circuit.openedAt &&
      Date.now() - circuit.openedAt > this.recoveryTimeMs
    ) {
      circuit.state = 'HALF_OPEN';
    }
  }

  private onSuccess(key: string) {
    this.circuits.set(key, { state: 'CLOSED', failures: 0 });
  }

  private onFailure(key: string) {
    const circuit = this.circuits.get(key) ?? { state: 'CLOSED', failures: 0 };

    circuit.failures += 1;

    if (circuit.failures >= this.failureThreshold) {
      circuit.state = 'OPEN';
      circuit.openedAt = Date.now();
    }

    this.circuits.set(key, circuit);
  }
}
