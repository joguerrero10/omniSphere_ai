const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api`;

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

export const botRulesService = {
  async getAll(botId: string) {
    const res = await fetch(`${BASE_URL}/bots/${botId}/rules`, { headers: getAuthHeaders() });
    return handleResponse<import('../types/bots').BotRule[]>(res);
  },

  async create(botId: string, data: import('../types/bots').CreateBotRulePayload) {
    const res = await fetch(`${BASE_URL}/bots/${botId}/rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<import('../types/bots').BotRule>(res);
  },

  async update(botId: string, ruleId: string, data: import('../types/bots').UpdateBotRulePayload) {
    const res = await fetch(`${BASE_URL}/bots/${botId}/rules/${ruleId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<import('../types/bots').BotRule>(res);
  },

  async remove(botId: string, ruleId: string) {
    const res = await fetch(`${BASE_URL}/bots/${botId}/rules/${ruleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async updateMode(botId: string, responseMode: import('../types/bots').BotResponseMode, mainMenuText?: string) {
    const res = await fetch(`${BASE_URL}/bots/${botId}/mode`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ responseMode, mainMenuText }),
    });
    return handleResponse<{ id: string; responseMode: string; mainMenuText: string }>(res);
  },
};