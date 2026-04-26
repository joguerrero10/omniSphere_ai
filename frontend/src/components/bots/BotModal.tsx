import { useEffect, useState } from 'react';
import type { Bot, CreateBotPayload } from '../../types/bots';

interface BotModalProps {
  bot?: Bot | null;
  onClose: () => void;
  onSave: (data: CreateBotPayload) => Promise<void>;
}

const defaultForm: CreateBotPayload = {
  name: '',
  description: '',
  model: 'GPT_4O_MINI',
  systemPrompt: '',
  temperature: 0.7,
  maxTokens: 1000,
  status: 'DRAFT',
  welcomeMsg: '¡Hola! ¿En qué puedo ayudarte?',
};

export function BotModal({ bot, onClose, onSave }: BotModalProps) {
  const [form, setForm] = useState<CreateBotPayload>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const isEdit = !!bot;

  useEffect(() => {
    if (bot) {
      setForm({
        name: bot.name,
        description: bot.description ?? '',
        model: bot.model,
        systemPrompt: bot.systemPrompt ?? '',
        temperature: bot.temperature,
        maxTokens: bot.maxTokens,
        status: bot.status,
        welcomeMsg: bot.welcomeMsg ?? '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [bot]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon">{isEdit ? '✦' : '+'}</div>
            <div>
              <h2>{isEdit ? 'Editar bot' : 'Nuevo bot'}</h2>
              <p>{isEdit ? `Modificando ${bot?.name}` : 'Configura tu asistente IA'}</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            General
          </button>
          <button
            className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Configuración IA
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {activeTab === 'basic' && (
              <div className="form-grid">
                <div className="field full">
                  <label>Nombre *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ej: Asistente de ventas"
                    autoFocus
                  />
                </div>
                <div className="field full">
                  <label>Descripción</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="¿Para qué sirve este bot?"
                    rows={2}
                  />
                </div>
                <div className="field">
                  <label>Modelo IA</label>
                  <div className="field">
                    <label>Modelo IA</label>
                    <select name="model" value={form.model} onChange={handleChange}>
                      <optgroup label="Groq — Llama">
                        <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                      </optgroup>
                    </select>
                    <span className="hint">Escribe o selecciona un modelo</span>
                  </div>
                </div>
                <div className="field">
                  <label>Estado</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="DRAFT">Borrador</option>
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
                <div className="field full">
                  <label>Mensaje de bienvenida</label>
                  <input
                    name="welcomeMsg"
                    value={form.welcomeMsg}
                    onChange={handleChange}
                    placeholder="¡Hola! ¿En qué puedo ayudarte?"
                  />
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="form-grid">
                <div className="field full">
                  <label>System Prompt</label>
                  <textarea
                    name="systemPrompt"
                    value={form.systemPrompt}
                    onChange={handleChange}
                    placeholder="Eres un asistente de ventas amigable y profesional..."
                    rows={6}
                  />
                  <span className="hint">
                    Define el comportamiento y personalidad del bot
                  </span>
                </div>
                <div className="field">
                  <label>
                    Temperatura{' '}
                    <span className="value-badge">{form.temperature}</span>
                  </label>
                  <input
                    type="range"
                    name="temperature"
                    min="0"
                    max="2"
                    step="0.1"
                    value={form.temperature}
                    onChange={handleChange}
                    className="range-input"
                  />
                  <div className="range-labels">
                    <span>Preciso</span>
                    <span>Creativo</span>
                  </div>
                </div>
                <div className="field">
                  <label>Máx. tokens</label>
                  <input
                    type="number"
                    name="maxTokens"
                    value={form.maxTokens}
                    onChange={handleChange}
                    min={100}
                    max={8000}
                    step={100}
                  />
                  <span className="hint">100 – 8000</span>
                </div>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : isEdit ? (
                'Guardar cambios'
              ) : (
                'Crear bot'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}