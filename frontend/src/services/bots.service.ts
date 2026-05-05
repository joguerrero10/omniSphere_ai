import type { Bot, CreateBotPayload, UpdateBotPayload } from '../types/bots';
import api from './api';

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

export const botsService = {
  async getAll(): Promise<Bot[]> {
    const { data } = await api.get('/bots');
    return data;
  },

  async getById(id: string): Promise<Bot> {
    const { data } = await api.get(`/bots/${id}`);
    return data;
  },

  async create(payload: CreateBotPayload): Promise<Bot> {
    const { data } = await api.post('/bots', payload);
    return data;
  },

  async update(id: string, payload: UpdateBotPayload): Promise<Bot> {
    const { data } = await api.put(`/bots/${id}`, payload);
    return data;
  },

  async updateStatus(id: string, status: Bot['status']): Promise<Bot> {
    const { data } = await api.patch(`/bots/${id}/status`, { status });
    return data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/bots/${id}`);
    return data;
  },

  async chat(id: string, messages: ChatMessage[]): Promise<ChatResponse> {
    const { data } = await api.post(`/bots/${id}/chat`, { messages });
    return data;
  },
};
