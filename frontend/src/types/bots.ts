export type BotStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

// export type BotModel =
//   | 'GPT_4O'
//   | 'GPT_4O_MINI'
//   | 'CLAUDE_3_5_SONNET'
//   | 'CLAUDE_3_HAIKU'
//   | 'GEMINI_PRO'
//   | 'GROQ';

export type BotModel = string;

export interface Bot {
  id: string;
  name: string;
  description?: string;
  model: BotModel;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  status: BotStatus;
  avatarUrl?: string;
  welcomeMsg?: string;
  totalConversations: number;
  totalMessages: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBotPayload {
  name: string;
  description?: string;
  model?: BotModel;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  status?: BotStatus;
  avatarUrl?: string;
  welcomeMsg?: string;
}

export type UpdateBotPayload = Partial<CreateBotPayload>;

// Se comenta para futuro ampliar y colocar más modelos se deja la logica por los momentos
// export const BOT_MODEL_LABELS: Record<BotModel, string> = {
//   GPT_4O: 'GPT-4o',
//   GPT_4O_MINI: 'GPT-4o Mini',
//   CLAUDE_3_5_SONNET: 'Claude 3.5 Sonnet',
//   CLAUDE_3_HAIKU: 'Claude 3 Haiku',
//   GEMINI_PRO: 'Gemini Pro',
//   GROQ: 'llama3-8b-8192'
// };

export const BOT_MODEL_LABELS: Record<string, string> = {
  'llama3-8b-8192': 'Llama 3 8B (Groq)',
  'llama3-70b-8192': 'Llama 3 70B (Groq)',
  'mixtral-8x7b-32768': 'Mixtral 8x7B (Groq)',
  'gemma2-9b-it': 'Gemma 2 9B (Groq)',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
};

export const BOT_STATUS_LABELS: Record<BotStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  DRAFT: 'Borrador',
};