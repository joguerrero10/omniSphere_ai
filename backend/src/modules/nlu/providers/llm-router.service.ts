import { Injectable } from '@nestjs/common';
import { ExternalLlmProvider } from '../interfaces/llm-provider.interface';
import { LlmRequest } from '../interfaces/llm-request.interface';

export interface RouteDecision {
  provider: ExternalLlmProvider | 'local';
  fallbackChain: ExternalLlmProvider[];
  model: string;
  reason: string;
}

@Injectable()
export class LlmRouterService {
  decide(req: LlmRequest): RouteDecision {
    const promptLength = req.prompt?.length ?? 0;

    if (req.taskType === 'classification' && promptLength < 600) {
      return {
        provider: 'local',
        fallbackChain: [],
        model: 'local-ml-classifier',
        reason: 'Clasificación simple resuelta localmente',
      };
    }

    if (req.taskType === 'chat' && req.stream) {
      return {
        provider: 'groq',
        fallbackChain: ['openai', 'anthropic'],
        model: 'llama-3.1-8b-instant',
        reason: 'Groq priorizado por latencia',
      };
    }

    if (req.taskType === 'extraction' || req.taskType === 'routing') {
      return {
        provider: 'groq',
        fallbackChain: ['openai', 'anthropic'],
        model: 'llama-3.1-8b-instant',
        reason: 'Tarea estructurada y de baja latencia',
      };
    }

    if (promptLength > 3000 || req.taskType === 'fallback') {
      return {
        provider: 'openai',
        fallbackChain: ['groq', 'anthropic'],
        model: 'gpt-4.1',
        reason: 'Mayor capacidad para prompts complejos',
      };
    }

    return {
      provider: 'groq',
      fallbackChain: ['openai', 'anthropic'],
      model: 'llama-3.1-8b-instant',
      reason: 'Ruta por defecto optimizada para costo y latencia',
    };
  }
}
