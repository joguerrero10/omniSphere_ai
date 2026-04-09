import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CompleteProviderRequest,
  ExternalLlmAdapter,
  ProviderResult,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class AnthropicProvider implements ExternalLlmAdapter {
  readonly providerName = 'anthropic' as const;

  constructor(private readonly configService: ConfigService) { }

  async complete(req: CompleteProviderRequest): Promise<ProviderResult> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('ANTHROPIC_API_KEY no configurado');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: req.model,
        temperature: req.temperature ?? 0,
        max_tokens: req.maxTokens ?? 512,
        system: req.systemPrompt ?? undefined,
        messages: [{ role: 'user', content: req.prompt }],
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(await response.text());
    }

    const data = await response.json();

    return {
      text: data?.content?.[0]?.text ?? '',
      model: req.model,
      provider: this.providerName,
      usage: {
        promptTokens: data?.usage?.input_tokens,
        completionTokens: data?.usage?.output_tokens,
        totalTokens:
          (data?.usage?.input_tokens ?? 0) + (data?.usage?.output_tokens ?? 0),
      },
      raw: data,
    };
  }
}
