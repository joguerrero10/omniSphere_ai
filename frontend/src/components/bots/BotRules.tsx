import { useEffect, useState } from 'react';

import { botRulesService } from '../../services/bots-rules.service';
import type { Bot, BotButton, BotResponseMode, BotRule, CreateBotRulePayload } from '../../types/bots';

interface BotRulesProps { bot: Bot; }

const emptyRule: CreateBotRulePayload = {
  keywords: [],
  menuOption: '',
  responseText: '',
  buttons: [],
  sortOrder: 0,
  isActive: true,
};


export function BotRules({ bot }: BotRulesProps) {
  const [rules, setRules] = useState<BotRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<BotResponseMode>(bot.responseMode ?? 'AI');
  const [mainMenuText, setMainMenuText] = useState(bot.mainMenuText ?? '¿En qué puedo ayudarte?');
  const [editingRule, setEditingRule] = useState<BotRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateBotRulePayload>(emptyRule);
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    botRulesService.getAll(bot.id).then((data) => {
      setRules(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [bot.id]);

  // ─── Modo ─────────────────────────────────────────────────────
  const handleModeChange = async (newMode: BotResponseMode) => {
    setMode(newMode);
    await botRulesService.updateMode(bot.id, newMode, mainMenuText).catch(() => { });
    showToast(newMode === 'AI' ? 'Modo IA activado' : 'Modo respuestas predefinidas activado');
  };

  const handleMainMenuSave = async () => {
    await botRulesService.updateMode(bot.id, mode, mainMenuText);
    showToast('Texto del menú guardado');
  };

  // ─── Form ─────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingRule(null);
    setForm(emptyRule);
    setKeywordInput('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (rule: BotRule) => {
    setEditingRule(rule);
    setForm({
      keywords: rule.keywords,
      menuOption: rule.menuOption ?? '',
      responseText: rule.responseText,
      buttons: rule.buttons ?? [],
      sortOrder: rule.sortOrder,
      isActive: rule.isActive,
    });
    setKeywordInput('');
    setError('');
    setShowForm(true);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !form.keywords.includes(kw)) {
      setForm((p) => ({ ...p, keywords: [...p.keywords, kw] }));
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) =>
    setForm((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== kw) }));

  const addButton = () => {
    const btns = form.buttons ?? [];
    if (btns.length >= 3) return;
    setForm((p) => ({
      ...p,
      buttons: [...(p.buttons ?? []), { id: `btn_${Date.now()}`, title: '' }],
    }));
  };

  const updateButton = (idx: number, field: keyof BotButton, value: string) =>
    setForm((p) => ({
      ...p,
      buttons: (p.buttons ?? []).map((b, i) => i === idx ? { ...b, [field]: value } : b),
    }));

  const removeButton = (idx: number) =>
    setForm((p) => ({ ...p, buttons: (p.buttons ?? []).filter((_, i) => i !== idx) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.responseText.trim()) { setError('La respuesta es obligatoria'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        menuOption: form.menuOption?.trim() || undefined,
        buttons: (form.buttons ?? [])
          .filter((b) => b.title.trim())
          .map((b, i) => ({
            id: b.id || `btn_${Date.now()}_${i}`,
            title: b.title.trim(),
          })),
      };
      if (editingRule) {
        const updated = await botRulesService.update(bot.id, editingRule.id, payload);
        setRules((p) => p.map((r) => r.id === updated.id ? updated : r));
        showToast('Regla actualizada');
      } else {
        const created = await botRulesService.create(bot.id, payload);
        setRules((p) => [...p, created]);
        showToast('Regla creada');
      }
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    await botRulesService.remove(bot.id, ruleId);
    setRules((p) => p.filter((r) => r.id !== ruleId));
    showToast('Regla eliminada');
  };

  const toggleActive = async (rule: BotRule) => {
    const updated = await botRulesService.update(bot.id, rule.id, { isActive: !rule.isActive });
    setRules((p) => p.map((r) => r.id === updated.id ? updated : r));
  };

  return (
    <div className="rules-container">

      { }
      <div className="rules-mode-card">
        <div className="rules-mode-header">
          <div>
            <h3 className="rules-mode-title">Modo de respuesta</h3>
            <p className="rules-mode-sub">Elige cómo responderá este bot</p>
          </div>
        </div>
        <div className="rules-mode-options">
          <button
            className={`mode-option ${mode === 'AI' ? 'active' : ''}`}
            onClick={() => handleModeChange('AI')}
          >
            <span className="mode-icon">◈</span>
            <div>
              <strong>Inteligencia Artificial</strong>
              <p>Responde usando Groq + el system prompt configurado</p>
            </div>
          </button>
          <button
            className={`mode-option ${mode === 'PREDEFINED' ? 'active' : ''}`}
            onClick={() => handleModeChange('PREDEFINED')}
          >
            <span className="mode-icon">☰</span>
            <div>
              <strong>Respuestas predefinidas</strong>
              <p>Responde con reglas de palabras clave y menú interactivo</p>
            </div>
          </button>
        </div>
      </div>

      { }
      {mode === 'PREDEFINED' && (
        <div className="rules-menu-card">
          <label className="rules-section-label">Texto del menú principal</label>
          <p className="hint" style={{ marginBottom: 8 }}>
            Se muestra cuando el usuario escribe algo que no coincide con ninguna regla
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="rules-menu-input"
              value={mainMenuText}
              onChange={(e) => setMainMenuText(e.target.value)}
              placeholder="¿En qué puedo ayudarte? Elige una opción:"
            />
            <button className="btn-outline" onClick={handleMainMenuSave}>Guardar</button>
          </div>
        </div>
      )}

      { }
      <div className="rules-list-header">
        <div>
          <h3 className="rules-section-label">
            Reglas de respuesta
            <span className="rules-count">{rules.length}</span>
          </h3>
          {mode === 'AI' && (
            <p className="hint">Las reglas se ignoran en modo IA, pero puedes crearlas para cuando cambies de modo</p>
          )}
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nueva regla</button>
      </div>

      {loading ? (
        <div className="bots-loading"><div className="loading-spinner" /></div>
      ) : rules.length === 0 ? (
        <div className="rules-empty">
          <p>☰</p>
          <p>No hay reglas todavía</p>
          <button className="btn-outline" onClick={openCreate}>Crear primera regla</button>
        </div>
      ) : (
        <div className="rules-list">
          {rules.map((rule) => (
            <div key={rule.id} className={`rule-card ${!rule.isActive ? 'rule-card--inactive' : ''}`}>
              <div className="rule-card-left">
                {rule.menuOption && (
                  <span className="rule-menu-badge">📋 {rule.menuOption}</span>
                )}
                <p className="rule-response">{rule.responseText}</p>
                <div className="rule-keywords">
                  {rule.keywords.map((kw) => (
                    <span key={kw} className="keyword-tag">{kw}</span>
                  ))}
                </div>
                {rule.buttons && rule.buttons.length > 0 && (
                  <div className="rule-buttons-preview">
                    {(rule.buttons as BotButton[]).map((b) => (
                      <span key={b.id} className="rule-btn-preview">{b.title}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rule-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="action-btn"
                  title={rule.isActive ? 'Desactivar' : 'Activar'}
                  onClick={() => toggleActive(rule)}
                >
                  {rule.isActive ? '⏸' : '▶'}
                </button>
                <button className="action-btn" title="Editar" onClick={() => openEdit(rule)}>✎</button>
                <button className="action-btn action-btn--danger" title="Eliminar" onClick={() => handleDelete(rule.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      { }
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon">☰</div>
                <div>
                  <h2>{editingRule ? 'Editar regla' : 'Nueva regla'}</h2>
                  <p>Define cuándo y cómo responder</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
                { }
                <div className="field full">
                  <label>Palabras clave</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                      placeholder="Escribe y presiona Enter o +"
                    />
                    <button type="button" className="btn-outline" onClick={addKeyword}>+</button>
                  </div>
                  <div className="keyword-list">
                    {form.keywords.map((kw) => (
                      <span key={kw} className="keyword-tag keyword-tag--removable">
                        {kw}
                        <button type="button" onClick={() => removeKeyword(kw)}>✕</button>
                      </span>
                    ))}
                  </div>
                  <span className="hint">El bot responde cuando el mensaje contiene alguna de estas palabras</span>
                </div>

                { }
                <div className="field full">
                  <label>Opción de menú (opcional)</label>
                  <input
                    value={form.menuOption}
                    onChange={(e) => setForm((p) => ({ ...p, menuOption: e.target.value }))}
                    placeholder="Ej: precios, 1, información"
                  />
                  <span className="hint">Aparece como botón en el menú principal y también activa esta regla si el usuario lo escribe exacto</span>
                </div>
                { }
                <div className="field full">
                  <label>Respuesta *</label>
                  <textarea
                    value={form.responseText}
                    onChange={(e) => setForm((p) => ({ ...p, responseText: e.target.value }))}
                    placeholder="Texto que el bot enviará cuando se active esta regla..."
                    rows={4}
                  />
                </div>

                { }
                <div className="field full">
                  <label>Botones de respuesta rápida (máx 3)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(form.buttons ?? []).map((btn, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          value={btn.title}
                          onChange={(e) => updateButton(i, 'title', e.target.value)}
                          placeholder={`Botón ${i + 1} (máx 20 chars)`}
                          maxLength={20}
                        />
                        <button type="button" className="action-btn action-btn--danger" onClick={() => removeButton(i)}>✕</button>
                      </div>
                    ))}
                    {(form.buttons ?? []).length < 3 && (
                      <button type="button" className="btn-ghost" style={{ width: 'fit-content' }} onClick={addButton}>
                        + Agregar botón
                      </button>
                    )}
                  </div>
                  <span className="hint">Los botones se muestran debajo de la respuesta en WhatsApp</span>
                </div>

                { }
                <div className="field" style={{ maxWidth: 140 }}>
                  <label>Orden en el menú</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    min={0}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                {error && <p className="form-error">{error}</p>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : editingRule ? 'Guardar cambios' : 'Crear regla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast toast--success">{toast}</div>}
    </div>
  );
}