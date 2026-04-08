import { Injectable } from "@nestjs/common";
import { ProviderResult } from "../interfaces/provider.result.interface";
import { AnthropicProvider } from "./anthropic.provider";
import { OpenAiProvider } from "./openai.provider";

@Injectable()
export class MultiProviderLlmService {
  constructor(
    private readonly openAiProvider: OpenAiProvider,
    private readonly anthropicProvider: AnthropicProvider,
  ) { }

  async complete(req: {
    prompt: string;
    model: string;
    fallbackModel?: string;
  }): Promise<ProviderResult> {
    try {
      return await this.openAiProvider.complete(req);
    } catch (error) {
      return await this.anthropicProvider.complete({
        ...req,
        model: req.fallbackModel ?? 'claude-sonnet',
      });
    }
  }
}