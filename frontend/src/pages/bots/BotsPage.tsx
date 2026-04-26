// src/pages/bots/BotsPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotCard } from '../../components/bots/BotCard';
import { BotDetail } from '../../components/bots/BotDetail';
import { BotModal } from '../../components/bots/BotModal';
import { DeleteConfirmModal } from '../../components/bots/DeleteConfirmModal';
import { botsService } from '../../services/bots.service';
import type { Bot, CreateBotPayload } from '../../types/bots';
import './BotsPage.css';

type View = 'list' | 'detail';

export default function BotsPage() {
  const navigate = useNavigate();

  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('list');
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [deletingBot, setDeletingBot] = useState<Bot | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const filtered = bots.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalActive = bots.filter((b) => b.status === 'ACTIVE').length;
  const totalDraft = bots.filter((b) => b.status === 'DRAFT').length;

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
          onEdit={(b) => setEditingBot(b)}
          onDelete={(b) => setDeletingBot(b)}
          onToggleStatus={handleToggleStatus}
        />
        {editingBot && (
          <BotModal bot={editingBot} onClose={() => setEditingBot(null)} onSave={handleUpdate} />
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

      {/* ── Breadcrumb nav ─────────────────────────────────── */}
      <nav className="bots-breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/dashboard')}>
          Dashboard
        </button>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Bots</span>
      </nav>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bots-header">
        <div className="bots-header-left">
          <h1 className="bots-title">Bots</h1>
          <div className="bots-counters">
            <span className="counter counter--total">{bots.length} total</span>
            <span className="counter counter--active">{totalActive} activos</span>
            {totalDraft > 0 && (
              <span className="counter counter--draft">{totalDraft} borradores</span>
            )}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <span>+</span> Nuevo bot
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="bots-toolbar">
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Buscar por nombre o descripción..."
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
              <div className="empty-icon">⌕</div>
              <p>Sin resultados para <strong>"{search}"</strong></p>
              <button className="btn-ghost" onClick={() => setSearch('')}>Limpiar búsqueda</button>
            </>
          ) : (
            <>
              <div className="empty-icon">◈</div>
              <p>Aún no tienes ningún bot</p>
              <p className="empty-sub">Crea tu primer asistente de IA</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                + Crear primer bot
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
        <BotModal onClose={() => setShowCreateModal(false)} onSave={handleCreate} />
      )}
      {editingBot && (
        <BotModal bot={editingBot} onClose={() => setEditingBot(null)} onSave={handleUpdate} />
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