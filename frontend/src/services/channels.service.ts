const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api`;

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  apiVersion?: string;
  appSecret?: string;
  skipSignatureValidation?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: 'WHATSAPP' | 'TELEGRAM' | 'WEBCHAT' | 'INSTAGRAM';
  status: 'ACTIVE' | 'INACTIVE';
  botId?: string | null;
  flowId?: string | null;
  configJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  return res.json();
}

export const channelsService = {
  async getAll(): Promise<Channel[]> {
    const res = await fetch(`${BASE_URL}/channels`, { headers: getAuthHeaders() });
    return handleResponse<Channel[]>(res);
  },

  // Crear canal WhatsApp vinculado a un bot
  async createWhatsApp(botId: string, config: WhatsAppConfig): Promise<Channel> {
    const res = await fetch(`${BASE_URL}/channels`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: `WhatsApp Bot`,
        type: 'WHATSAPP',
        botId,
        configJson: config,
        webhookSecret: config.verifyToken,
      }),
    });
    return handleResponse<Channel>(res);
  },

  // Actualizar configuración WhatsApp
  async updateWhatsApp(channelId: string, config: Partial<WhatsAppConfig>): Promise<Channel> {
    const res = await fetch(`${BASE_URL}/channels/${channelId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ configJson: config }),
    });
    return handleResponse<Channel>(res);
  },

  // Desconectar canal (eliminar)
  async remove(channelId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/channels/${channelId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  // Buscar canal WhatsApp de un bot específico
  async getByBotId(botId: string): Promise<Channel | null> {
    const all = await channelsService.getAll();
    return all.find((c) => c.botId === botId && c.type === 'WHATSAPP') ?? null;
  },
};