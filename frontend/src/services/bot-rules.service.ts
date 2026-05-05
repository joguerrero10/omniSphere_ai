import type {
  BotResponseMode,
  BotRule,
  CreateBotRulePayload,
  UpdateBotRulePayload,
} from '../types/bots';
import api from './api';

export const botRulesService = {
  async getAll(botId: string): Promise<BotRule[]> {
    const { data } = await api.get(`/bots/${botId}/rules`);
    return data;
  },

  async create(botId: string, payload: CreateBotRulePayload): Promise<BotRule> {
    const { data } = await api.post(`/bots/${botId}/rules`, payload);
    return data;
  },

  async update(botId: string, ruleId: string, payload: UpdateBotRulePayload): Promise<BotRule> {
    const { data } = await api.patch(`/bots/${botId}/rules/${ruleId}`, payload);
    return data;
  },

  async remove(botId: string, ruleId: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/bots/${botId}/rules/${ruleId}`);
    return data;
  },

  async updateMode(
    botId: string,
    responseMode: BotResponseMode,
    mainMenuText?: string,
  ): Promise<{ id: string; responseMode: string; mainMenuText: string }> {
    const { data } = await api.patch(`/bots/${botId}/mode`, { responseMode, mainMenuText });
    return data;
  },
};
