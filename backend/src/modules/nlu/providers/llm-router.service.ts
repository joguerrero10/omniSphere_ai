import { Injectable } from '@nestjs/common';
import { LlmRequest } from '../interfaces/llm-request.interface';

export interface RouteDecision {
  provider: 'openai' | 'anthropic' | 'local' | 'groq';
  model: string;
  reason: string;
}

@Injectable()
export class LlmRouterService {
  decide(req: LlmRequest): RouteDecision {
    const promptLength = req.prompt?.length ?? 0;

    // ✅ Clasificación simple → local
    if (req.taskType === 'classification' && promptLength < 600) {
      return {
        provider: 'local',
        model: 'local-ml-classifier',
        reason: 'Clasificación simple resuelta localmente',
      };
    }

    // ⚡ Clasificación / extracción rápida → Groq
    if (
      (req.taskType === 'classification' && promptLength < 1500) ||
      req.taskType === 'routing'
    ) {
      return {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        reason: 'Ultra baja latencia para tareas rápidas',
      };
    }

    // 🧩 Extracción estructurada → OpenAI (más consistente)
    if (req.taskType === 'extraction') {
      return {
        provider: 'openai',
        model: 'gpt-4o-mini',
        reason: 'Alta precisión en extracción estructurada',
      };
    }

    // 💬 Chat streaming → Groq (más rápido)
    if (req.taskType === 'chat' && req.stream) {
      return {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        reason: 'Streaming rápido y menor latencia',
      };
    }

    if (promptLength > 3000 || req.taskType === 'fallback') {
      return {
        provider: 'openai',
        model: 'gpt-4.1',
        reason: 'Mayor contexto o razonamiento complejo',
      };
    }

    // ⚖️ Default optimizado costo/latencia
    return {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      reason: 'Ruta por defecto optimizada para latencia/costo',
    };
  }
}