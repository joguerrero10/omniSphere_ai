import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { CompleteProviderRequest, ExternalLlmAdapter, ProviderResult } from '../interfaces/llm-provider.interface';

@Injectable()
export class GroqProvider implements ExternalLlmAdapter {
  readonly providerName = 'groq' as const;
  private readonly logger = new Logger(GroqProvider.name);
  private readonly client: Groq | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    this.client = apiKey ? new Groq({ apiKey }) : null;
  }

  async complete(req: CompleteProviderRequest): Promise<ProviderResult> {
    if (!this.client) {
      throw new ServiceUnavailableException('GROQ_API_KEY no configurado');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: req.model,
        temperature: req.temperature ?? 0,
        max_tokens: req.maxTokens ?? 512,
        messages: [
          ...(req.systemPrompt
            ? [{ role: 'system' as const, content: req.systemPrompt }]
            : []),
          { role: 'user' as const, content: req.prompt },
        ],
      });

      return {
        text: response.choices?.[0]?.message?.content ?? '',
        model: req.model,
        provider: this.providerName,
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
        raw: response,
      };
    } catch (error) {
      this.logger.error('Groq request failed', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
