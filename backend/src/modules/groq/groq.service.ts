import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  messages: ChatMessage[];
}

export interface GroqChatResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

@Injectable()
export class GroqService {
  private readonly groq: Groq;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GROQ_API_KEY no configurada');
    }
    this.groq = new Groq({ apiKey });
  }

  async chat(options: GroqChatOptions): Promise<GroqChatResult> {
    const { model, temperature = 0.7, maxTokens = 1000, systemPrompt, messages } = options;

    // Construir el array de mensajes con system prompt al inicio
    const fullMessages: ChatMessage[] = [
      ...(systemPrompt
        ? [{ role: 'system' as const, content: systemPrompt }]
        : []),
      ...messages,
    ];

    try {
      const completion = await this.groq.chat.completions.create({
        model,
        messages: fullMessages,
        temperature,
        max_tokens: maxTokens,
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new InternalServerErrorException('Groq no devolvió respuesta');
      }

      return {
        content: choice.message.content,
        model: completion.model,
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      };
    } catch (error: unknown) {
      if (error instanceof Groq.APIError) {
        throw new InternalServerErrorException(
          `Error de Groq [${error.status}]: ${error.message}`,
        );
      }
      throw error;
    }
  }
}