// src/components/bots/DeleteConfirmModal.tsx
import type { Bot } from '../../types/bots';

interface DeleteConfirmModalProps {
  bot: Bot;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmModal({ bot, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon">⚠</div>
        <h2 className="delete-modal-title">¿Eliminar este bot?</h2>
        <p className="delete-modal-desc">
          Estás a punto de eliminar <strong>{bot.name}</strong>. Esta acción no
          se puede deshacer y se perderán todas las conversaciones asociadas.
        </p>

        <div className="delete-modal-stats">
          <div className="delete-stat">
            <span>{bot.totalConversations}</span>
            <span>conversaciones</span>
          </div>
          <div className="delete-stat">
            <span>{bot.totalMessages}</span>
            <span>mensajes</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}