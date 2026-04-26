// src/components/bots/BotCard.tsx
import type { Bot } from '../../types/bots';

interface BotCardProps {
  bot: Bot;
  onView: (bot: Bot) => void;
  onEdit: (bot: Bot) => void;
  onDelete: (bot: Bot) => void;
  onToggleStatus: (bot: Bot) => void;
}

const STATUS_CONFIG = {
  ACTIVE: { label: 'Activo', cls: 'status-active' },
  INACTIVE: { label: 'Inactivo', cls: 'status-inactive' },
  DRAFT: { label: 'Borrador', cls: 'status-draft' },
};

// Muestra el modelo tal como viene — sin depender del enum viejo
function modelLabel(model: string): string {
  const known: Record<string, string> = {
    'llama-3.1-8b-instant': 'Llama 3.1 8B',
    'llama-3.1-70b-versatile': 'Llama 3.1 70B',
    'llama-3.3-70b-versatile': 'Llama 3.3 70B',
    'mixtral-8x7b-32768': 'Mixtral 8x7B',
    'gemma2-9b-it': 'Gemma 2 9B',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
  };
  return known[model] ?? model;
}

function modelProvider(model: string): string {
  if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('gemma')) return 'Groq';
  if (model.startsWith('gpt')) return 'OpenAI';
  if (model.startsWith('claude')) return 'Anthropic';
  return 'AI';
}

export function BotCard({ bot, onView, onEdit, onDelete, onToggleStatus }: BotCardProps) {
  const status = STATUS_CONFIG[bot.status];
  const initials = bot.name.slice(0, 2).toUpperCase();

  return (
    <div className="bot-card" onClick={() => onView(bot)}>
      {/* Status indicator bar */}
      <div className={`bot-card-bar bot-card-bar--${bot.status.toLowerCase()}`} />

      <div className="bot-card-inner">
        {/* Header */}
        <div className="bot-card-header">
          <div className="bot-avatar">
            {bot.avatarUrl
              ? <img src={bot.avatarUrl} alt={bot.name} />
              : <span>{initials}</span>}
          </div>
          <span className={`status-badge ${status.cls}`}>
            <span className="status-dot" />
            {status.label}
          </span>
        </div>

        {/* Body */}
        <div className="bot-card-body">
          <h3 className="bot-name">{bot.name}</h3>
          {bot.description && (
            <p className="bot-description">{bot.description}</p>
          )}
        </div>

        {/* Model tag */}
        <div className="bot-model-tag">
          <span className="bot-model-provider">{modelProvider(bot.model)}</span>
          <span className="bot-model-name">{modelLabel(bot.model)}</span>
        </div>

        {/* Stats */}
        <div className="bot-card-stats">
          <div className="stat">
            <span className="stat-value">{bot.totalConversations.toLocaleString()}</span>
            <span className="stat-label">Conversaciones</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">{bot.totalMessages.toLocaleString()}</span>
            <span className="stat-label">Mensajes</span>
          </div>
        </div>

        {/* Actions */}
        <div className="bot-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="action-btn"
            title={bot.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
            onClick={() => onToggleStatus(bot)}
          >
            {bot.status === 'ACTIVE' ? '⏸' : '▶'}
          </button>
          <button className="action-btn" title="Editar" onClick={() => onEdit(bot)}>
            ✎
          </button>
          <button
            className="action-btn action-btn--danger"
            title="Eliminar"
            onClick={() => onDelete(bot)}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}