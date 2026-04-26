import type { Bot, CreateBotPayload, UpdateBotPayload } from '../types/bots';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  model: string;
  usage?: { totalTokens?: number };
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

export const botsService = {
  async getAll(): Promise<Bot[]> {
    const res = await fetch(`${BASE_URL}/bots`, { headers: getAuthHeaders() });
    return handleResponse<Bot[]>(res);
  },

  async getById(id: string): Promise<Bot> {
    const res = await fetch(`${BASE_URL}/bots/${id}`, { headers: getAuthHeaders() });
    return handleResponse<Bot>(res);
  },

  async create(data: CreateBotPayload): Promise<Bot> {
    const res = await fetch(`${BASE_URL}/bots`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Bot>(res);
  },

  async update(id: string, data: UpdateBotPayload): Promise<Bot> {
    const res = await fetch(`${BASE_URL}/bots/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Bot>(res);
  },

  async updateStatus(id: string, status: Bot['status']): Promise<Bot> {
    const res = await fetch(`${BASE_URL}/bots/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<Bot>(res);
  },

  async remove(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/bots/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // ─── Chat con Groq ──────────────────────────────────────────
  async chat(id: string, messages: ChatMessage[]): Promise<ChatResponse> {
    const res = await fetch(`${BASE_URL}/bots/${id}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messages }),
    });
    return handleResponse<ChatResponse>(res);
  },
};