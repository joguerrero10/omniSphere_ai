export type BotStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

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
  responseMode?: BotResponseMode;
  mainMenuText?: string;
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

export type BotResponseMode = 'AI' | 'PREDEFINED';

export interface BotButton { id: string; title: string; }

export interface BotRule {
  id: string;
  botId: string;
  keywords: string[];
  menuOption?: string | null;
  responseText: string;
  buttons?: BotButton[] | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBotRulePayload {
  keywords: string[];
  menuOption?: string;
  responseText: string;
  buttons?: BotButton[];
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateBotRulePayload = Partial<CreateBotRulePayload>;