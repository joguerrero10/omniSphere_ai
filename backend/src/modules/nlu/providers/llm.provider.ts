import { Injectable } from '@nestjs/common';
import { LlmClientService } from './llm-client.service';

@Injectable()
export class LlmProvider {
  constructor(private readonly llmClient: LlmClientService) { }

  async generate(params: {
    provider: string;
    modelName: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string | null;
  }): Promise<string> {
    const response = await this.llmClient.complete({
      prompt: params.prompt,
      taskType: 'generation',
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      metadata: {
        providerHint: params.provider,
        modelHint: params.modelName,
        systemPrompt: params.systemPrompt,
      },
    });

    return response.text;
  }
}
