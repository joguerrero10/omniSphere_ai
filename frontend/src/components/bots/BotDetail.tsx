import { useState } from 'react';
import type { Bot } from '../../types/bots';
import { BOT_MODEL_LABELS, BOT_STATUS_LABELS } from '../../types/bots';
import { BotChat } from './BotChat';
import { WhatsAppConnect } from './WhatsAppConnect';

interface BotDetailProps {
  bot: Bot;
  onBack: () => void;
  onEdit: (bot: Bot) => void;
  onDelete: (bot: Bot) => void;
  onToggleStatus: (bot: Bot) => void;
}

const MODEL_ICONS: Record<string, string> = {
  GPT_4O: '◈', GPT_4O_MINI: '◇', CLAUDE_3_5_SONNET: '✦',
  CLAUDE_3_HAIKU: '✧', GEMINI_PRO: '◆', GROQ: '◆',
};

const STATUS_CONFIG = {
  ACTIVE: { label: 'Activo', class: 'status-active' },
  INACTIVE: { label: 'Inactivo', class: 'status-inactive' },
  DRAFT: { label: 'Borrador', class: 'status-draft' },
};

type DetailTab = 'overview' | 'chat' | 'whatsapp';

export function BotDetail({ bot, onBack, onEdit, onDelete, onToggleStatus }: BotDetailProps) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const status = STATUS_CONFIG[bot.status];

  const createdDate = new Date(bot.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const updatedDate = new Date(bot.updatedAt).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="detail-view">
      {/* Top bar */}
      <div className="detail-topbar">
        <button className="btn-back" onClick={onBack}>← Volver a Bots</button>
        <div className="detail-actions">
          <button className="btn-outline" onClick={() => onToggleStatus(bot)}>
            {bot.status === 'ACTIVE' ? '⏸ Desactivar' : '▶ Activar'}
          </button>
          <button className="btn-outline" onClick={() => onEdit(bot)}>✎ Editar</button>
          <button className="btn-outline btn-outline--danger" onClick={() => onDelete(bot)}>
            ✕ Eliminar
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-avatar">
          {bot.avatarUrl
            ? <img src={bot.avatarUrl} alt={bot.name} />
            : <span>{MODEL_ICONS[bot.model] ?? '◈'}</span>}
        </div>
        <div className="detail-hero-info">
          <div className="detail-badges">
            <span className={`status-badge ${status.class}`}>
              <span className="status-dot" />{status.label}
            </span>
            <span className="model-badge">
              {MODEL_ICONS[bot.model] ?? '◈'} {BOT_MODEL_LABELS[bot.model] ?? bot.model}
            </span>
          </div>
          <h1 className="detail-name">{bot.name}</h1>
          {bot.description && <p className="detail-description">{bot.description}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          Información
        </button>
        <button
          className={`detail-tab ${tab === 'chat' ? 'active' : ''}`}
          onClick={() => setTab('chat')}
        >
          💬 Probar chat
        </button>
        <button
          className={`detail-tab ${tab === 'whatsapp' ? 'active' : ''}`}
          onClick={() => setTab('whatsapp')}
        >
          📱 WhatsApp
        </button>
      </div>

      {/* Tab: Información */}
      {tab === 'overview' && (
        <>
          <div className="detail-stats-row">
            <div className="detail-stat-card">
              <span className="detail-stat-value">{bot.totalConversations.toLocaleString()}</span>
              <span className="detail-stat-label">Total conversaciones</span>
            </div>
            <div className="detail-stat-card">
              <span className="detail-stat-value">{bot.totalMessages.toLocaleString()}</span>
              <span className="detail-stat-label">Total mensajes</span>
            </div>
            <div className="detail-stat-card">
              <span className="detail-stat-value">{bot.temperature}</span>
              <span className="detail-stat-label">Temperatura</span>
            </div>
            <div className="detail-stat-card">
              <span className="detail-stat-value">{bot.maxTokens.toLocaleString()}</span>
              <span className="detail-stat-label">Máx. tokens</span>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card detail-card--wide">
              <h3 className="detail-card-title"><span>◈</span> System Prompt</h3>
              {bot.systemPrompt
                ? <pre className="detail-prompt">{bot.systemPrompt}</pre>
                : <p className="detail-empty">Sin system prompt configurado.</p>}
            </div>
            <div className="detail-card">
              <h3 className="detail-card-title"><span>⚙</span> Configuración</h3>
              <ul className="detail-config-list">
                <li><span>Modelo</span><strong>{BOT_MODEL_LABELS[bot.model] ?? bot.model}</strong></li>
                <li><span>Estado</span><strong>{BOT_STATUS_LABELS[bot.status]}</strong></li>
                <li><span>Temperatura</span><strong>{bot.temperature}</strong></li>
                <li><span>Máx. tokens</span><strong>{bot.maxTokens}</strong></li>
              </ul>
            </div>
            <div className="detail-card">
              <h3 className="detail-card-title"><span>💬</span> Mensaje de bienvenida</h3>
              <p className="detail-welcome">{bot.welcomeMsg ?? '—'}</p>
            </div>
            <div className="detail-card">
              <h3 className="detail-card-title"><span>📅</span> Fechas</h3>
              <ul className="detail-config-list">
                <li><span>Creado</span><strong>{createdDate}</strong></li>
                <li><span>Actualizado</span><strong>{updatedDate}</strong></li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Tab: Chat */}
      {tab === 'chat' && <BotChat bot={bot} />}

      {/* Tab: WhatsApp */}
      {tab === 'whatsapp' && <WhatsAppConnect bot={bot} />}
    </div>
  );
}