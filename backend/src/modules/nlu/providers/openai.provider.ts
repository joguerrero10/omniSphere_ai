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
export class OpenAiProvider implements ExternalLlmAdapter {
  readonly providerName = 'openai' as const;

  constructor(private readonly configService: ConfigService) { }

  async complete(req: CompleteProviderRequest): Promise<ProviderResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY no configurado');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        temperature: req.temperature ?? 0,
        max_tokens: req.maxTokens ?? 512,
        messages: [
          ...(req.systemPrompt
            ? [{ role: 'system', content: req.systemPrompt }]
            : []),
          { role: 'user', content: req.prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(await response.text());
    }

    const data = await response.json();

    return {
      text: data?.choices?.[0]?.message?.content ?? '',
      model: req.model,
      provider: this.providerName,
      usage: {
        promptTokens: data?.usage?.prompt_tokens,
        completionTokens: data?.usage?.completion_tokens,
        totalTokens: data?.usage?.total_tokens,
      },
      raw: data,
    };
  }
}
