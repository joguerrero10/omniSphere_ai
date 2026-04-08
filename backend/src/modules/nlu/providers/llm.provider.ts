import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmProvider {
  private readonly logger = new Logger(LlmProvider.name);

  constructor(private readonly configService: ConfigService) { }

  async generate(params: {
    provider: string;
    modelName: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string | null;
  }): Promise<string> {
    const provider = params.provider?.toLowerCase?.() || this.configService.get<string>('DEFAULT_LLM_PROVIDER', 'openai');

    if (provider === 'openai') {
      return this.callOpenAi(params);
    }

    if (provider === 'anthropic' || provider === 'claude') {
      return this.callAnthropic(params);
    }

    if (provider === 'groq') {
      return this.callGroq(params);
    }

    return `[MOCK ${provider}] ${params.prompt.slice(0, 300)}`;
  }

  private async callOpenAi(params: {
    modelName: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string | null;
  }): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return `[MOCK OPENAI:${params.modelName}] ${params.prompt.slice(0, 300)}`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: params.modelName,
        temperature: params.temperature ?? 0.2,
        max_tokens: params.maxTokens ?? 500,
        messages: [
          {
            role: 'system',
            content: params.systemPrompt || 'Eres un clasificador NLU empresarial.',
          },
          {
            role: 'user',
            content: params.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`OpenAI error: ${errorText}`);
      return `[OPENAI ERROR] ${errorText}`;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  private async callAnthropic(params: {
    modelName: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string | null;
  }): Promise<string> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return `[MOCK CLAUDE:${params.modelName}] ${params.prompt.slice(0, 300)}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: params.modelName,
        max_tokens: params.maxTokens ?? 500,
        temperature: params.temperature ?? 0.2,
        system: params.systemPrompt || 'Eres un clasificador NLU empresarial.',
        messages: [
          {
            role: 'user',
            content: params.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Anthropic error: ${errorText}`);
      return `[ANTHROPIC ERROR] ${errorText}`;
    }

    const data = await response.json();
    return data?.content?.[0]?.text || '';
  }

  private async callGroq(params: {
    modelName: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string | null;
  }): Promise<string> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      return `[MOCK GROQ:${params.modelName}] ${params.prompt.slice(0, 300)}`;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: params.modelName || 'llama3-8b-8192',
        temperature: params.temperature ?? 0.2,
        max_tokens: params.maxTokens ?? 500,
        messages: [
          {
            role: 'system',
            content: params.systemPrompt || 'Eres un clasificador NLU empresarial.',
          },
          {
            role: 'user',
            content: params.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Groq error: ${errorText}`);
      return `[GROQ ERROR] ${errorText}`;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }
}
