import { useCallback, useEffect, useState } from 'react';
import { BotCard } from '../../components/bots/BotCard';
import { BotDetail } from '../../components/bots/BotDetail';
import { BotModal } from '../../components/bots/BotModal';
import { DeleteConfirmModal } from '../../components/bots/DeleteConfirmModal';
import { botsService } from '../../services/bots.service';
import type { Bot, CreateBotPayload } from '../../types/bots';
import './BotsPage.css';

type View = 'list' | 'detail';

export default function BotsPage() {
  // ─── State ──────────────────────────────────────────────────
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('list');
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [deletingBot, setDeletingBot] = useState<Bot | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Load bots ───────────────────────────────────────────────
  const loadBots = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await botsService.getAll();
      setBots(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar bots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBots(); }, [loadBots]);

  // ─── Filtered list ───────────────────────────────────────────
  const filtered = bots.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase()),
  );

  // Stats
  const totalActive = bots.filter((b) => b.status === 'ACTIVE').length;
  const totalDraft = bots.filter((b) => b.status === 'DRAFT').length;

  // ─── Handlers ────────────────────────────────────────────────
  const handleCreate = async (data: CreateBotPayload) => {
    const newBot = await botsService.create(data);
    setBots((prev) => [newBot, ...prev]);
    showToast('Bot creado correctamente');
  };

  const handleUpdate = async (data: CreateBotPayload) => {
    if (!editingBot) return;
    const updated = await botsService.update(editingBot.id, data);
    setBots((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    if (selectedBot?.id === updated.id) setSelectedBot(updated);
    showToast('Bot actualizado');
  };

  const handleDelete = async () => {
    if (!deletingBot) return;
    await botsService.remove(deletingBot.id);
    setBots((prev) => prev.filter((b) => b.id !== deletingBot.id));
    setDeletingBot(null);
    if (selectedBot?.id === deletingBot.id) {
      setSelectedBot(null);
      setView('list');
    }
    showToast('Bot eliminado');
  };

  const handleToggleStatus = async (bot: Bot) => {
    const newStatus = bot.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await botsService.updateStatus(bot.id, newStatus);
    setBots((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    if (selectedBot?.id === updated.id) setSelectedBot(updated);
    showToast(`Bot ${newStatus === 'ACTIVE' ? 'activado' : 'desactivado'}`);
  };

  const handleView = (bot: Bot) => {
    setSelectedBot(bot);
    setView('detail');
  };

  // ─── Detail view ─────────────────────────────────────────────
  if (view === 'detail' && selectedBot) {
    return (
      <div className="bots-page">
        <BotDetail
          bot={selectedBot}
          onBack={() => { setView('list'); setSelectedBot(null); }}
          onEdit={(b) => { setEditingBot(b); }}
          onDelete={(b) => setDeletingBot(b)}
          onToggleStatus={handleToggleStatus}
        />
        {editingBot && (
          <BotModal
            bot={editingBot}
            onClose={() => setEditingBot(null)}
            onSave={handleUpdate}
          />
        )}
        {deletingBot && (
          <DeleteConfirmModal
            bot={deletingBot}
            onConfirm={handleDelete}
            onCancel={() => setDeletingBot(null)}
          />
        )}
        {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────
  return (
    <div className="bots-page">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bots-header">
        <div>
          <h1 className="bots-title">Bots</h1>
          <p className="bots-subtitle">
            {bots.length} bot{bots.length !== 1 ? 's' : ''} ·{' '}
            {totalActive} activo{totalActive !== 1 ? 's' : ''} ·{' '}
            {totalDraft} borrador{totalDraft !== 1 ? 'es' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Nuevo bot
        </button>
      </div>

      {/* ── Search bar ─────────────────────────────────────── */}
      <div className="bots-toolbar">
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Buscar bots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {loading ? (
        <div className="bots-loading">
          <div className="loading-spinner" />
          <p>Cargando bots...</p>
        </div>
      ) : error ? (
        <div className="bots-error">
          <p>⚠ {error}</p>
          <button className="btn-outline" onClick={loadBots}>Reintentar</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bots-empty">
          {search ? (
            <>
              <p className="empty-icon">⌕</p>
              <p>No hay bots que coincidan con <strong>{search}</strong></p>
              <button className="btn-ghost" onClick={() => setSearch('')}>
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <>
              <p className="empty-icon">◈</p>
              <p>Aún no tienes ningún bot</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                Crear primer bot
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bots-grid">
          {filtered.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onView={handleView}
              onEdit={(b) => setEditingBot(b)}
              onDelete={(b) => setDeletingBot(b)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {showCreateModal && (
        <BotModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}
      {editingBot && (
        <BotModal
          bot={editingBot}
          onClose={() => setEditingBot(null)}
          onSave={handleUpdate}
        />
      )}
      {deletingBot && (
        <DeleteConfirmModal
          bot={deletingBot}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBot(null)}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}