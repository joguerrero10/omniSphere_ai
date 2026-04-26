import type { Bot } from '../../types/bots';
import { BOT_MODEL_LABELS } from '../../types/bots';

interface BotCardProps {
  bot: Bot;
  onView: (bot: Bot) => void;
  onEdit: (bot: Bot) => void;
  onDelete: (bot: Bot) => void;
  onToggleStatus: (bot: Bot) => void;
}

const STATUS_CONFIG = {
  ACTIVE: { label: 'Activo', class: 'status-active' },
  INACTIVE: { label: 'Inactivo', class: 'status-inactive' },
  DRAFT: { label: 'Borrador', class: 'status-draft' },
};

const MODEL_ICONS: Record<string, string> = {
  GPT_4O: '◈',
  GPT_4O_MINI: '◇',
  CLAUDE_3_5_SONNET: '✦',
  CLAUDE_3_HAIKU: '✧',
  GEMINI_PRO: '◆',
};

export function BotCard({ bot, onView, onEdit, onDelete, onToggleStatus }: BotCardProps) {
  const status = STATUS_CONFIG[bot.status];

  return (
    <div className="bot-card" onClick={() => onView(bot)}>
      <div className="bot-card-header">
        <div className="bot-avatar">
          {bot.avatarUrl ? (
            <img src={bot.avatarUrl} alt={bot.name} />
          ) : (
            <span>{MODEL_ICONS[bot.model] ?? '◈'}</span>
          )}
        </div>
        <div className="bot-meta">
          <span className={`status-badge ${status.class}`}>
            <span className="status-dot" />
            {status.label}
          </span>
        </div>
      </div>

      <div className="bot-card-body">
        <h3 className="bot-name">{bot.name}</h3>
        {bot.description && (
          <p className="bot-description">{bot.description}</p>
        )}
        <div className="bot-model-tag">
          {MODEL_ICONS[bot.model]} {BOT_MODEL_LABELS[bot.model]}
        </div>
      </div>

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
  );
}