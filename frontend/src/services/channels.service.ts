import api from './api';

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

export const channelsService = {
  async getAll(): Promise<Channel[]> {
    const { data } = await api.get('/channels');
    return data;
  },

  async createWhatsApp(botId: string, config: WhatsAppConfig): Promise<Channel> {
    const { data } = await api.post('/channels', {
      name: 'WhatsApp Bot',
      type: 'WHATSAPP',
      botId,
      configJson: config,
      webhookSecret: config.verifyToken,
    });
    return data;
  },

  async updateWhatsApp(channelId: string, config: Partial<WhatsAppConfig>): Promise<Channel> {
    const { data } = await api.patch(`/channels/${channelId}`, { configJson: config });
    return data;
  },

  async remove(channelId: string): Promise<void> {
    await api.delete(`/channels/${channelId}`);
  },

  async getByBotId(botId: string): Promise<Channel | null> {
    const all = await channelsService.getAll();
    return all.find((c) => c.botId === botId && c.type === 'WHATSAPP') ?? null;
  },
};
