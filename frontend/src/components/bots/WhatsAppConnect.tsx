import { useEffect, useState } from 'react';

import { channelsService, type Channel, type WhatsAppConfig } from '../../services/channels.service';
import type { Bot } from '../../types/bots';

interface WhatsAppConnectProps {
  bot: Bot;
}

const EMPTY_CONFIG: WhatsAppConfig = {
  accessToken: '',
  phoneNumberId: '',
  verifyToken: '',
  apiVersion: 'v23.0',
  skipSignatureValidation: true,//change in prd
};

export function WhatsAppConnect({ bot }: WhatsAppConnectProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState<WhatsAppConfig>(EMPTY_CONFIG);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar canal existente al montar
  useEffect(() => {
    channelsService.getByBotId(bot.id).then((ch) => {
      setChannel(ch);
      if (ch?.configJson) {
        setForm({
          accessToken: String(ch.configJson['accessToken'] ?? ''),
          phoneNumberId: String(ch.configJson['phoneNumberId'] ?? ''),
          verifyToken: String(ch.configJson['verifyToken'] ?? ''),
          apiVersion: String(ch.configJson['apiVersion'] ?? 'v23.0'),
          skipSignatureValidation: ch.configJson['skipSignatureValidation'] === true,
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [bot.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.accessToken || !form.phoneNumberId || !form.verifyToken) {
      setError('Access Token, Phone Number ID y Verify Token son obligatorios');
      return;
    }
    setSaving(true);
    try {
      if (channel) {
        const updated = await channelsService.updateWhatsApp(channel.id, form);
        setChannel(updated);
        setSuccess('Configuración actualizada');
      } else {
        const created = await channelsService.createWhatsApp(bot.id, form);
        setChannel(created);
        setShowForm(false);
        setSuccess('WhatsApp conectado correctamente');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!channel) return;
    setRemoving(true);
    try {
      await channelsService.remove(channel.id);
      setChannel(null);
      setForm(EMPTY_CONFIG);
      setSuccess('WhatsApp desconectado');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al desconectar');
    } finally {
      setRemoving(false);
    }
  };

  const webhookUrl = channel
    ? `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/channels/${channel.id}/webhook`
    : null;

  if (loading) {
    return (
      <div className="wa-loading">
        <div className="loading-spinner" />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="wa-container">
      {/* Header */}
      <div className="wa-header">
        <div className="wa-header-info">
          <div className="wa-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h3 className="wa-title">WhatsApp Business</h3>
            <p className="wa-subtitle">
              {channel ? 'Canal conectado' : 'Sin conectar'}
            </p>
          </div>
        </div>
        <span className={`status-badge ${channel ? 'status-active' : 'status-inactive'}`}>
          <span className="status-dot" />
          {channel ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Canal conectado */}
      {channel && !showForm && (
        <div className="wa-connected">
          {/* Webhook URL */}
          <div className="wa-webhook-box">
            <p className="wa-webhook-label">URL del Webhook (configura en Meta)</p>
            <div className="wa-webhook-url">
              <code>{webhookUrl}</code>
              <button
                className="wa-copy-btn"
                onClick={() => navigator.clipboard.writeText(webhookUrl ?? '')}
                title="Copiar"
              >
                ⧉
              </button>
            </div>
            <p className="hint">Callback URL y Verify Token en Meta for Developers → WhatsApp → Webhooks</p>
          </div>

          {/* Info */}
          <ul className="wa-info-list">
            <li>
              <span>Phone Number ID</span>
              <strong>{String((channel.configJson?.['phoneNumberId']) ?? '—')}</strong>
            </li>
            <li>
              <span>API Version</span>
              <strong>{String((channel.configJson?.['apiVersion']) ?? 'v23.0')}</strong>
            </li>
            <li>
              <span>Verify Token</span>
              <strong>••••••••</strong>
            </li>
          </ul>

          <div className="wa-actions">
            <button className="btn-outline" onClick={() => setShowForm(true)}>
              ✎ Editar configuración
            </button>
            <button
              className="btn-outline btn-outline--danger"
              onClick={handleDisconnect}
              disabled={removing}
            >
              {removing ? <span className="spinner" /> : '✕ Desconectar'}
            </button>
          </div>
        </div>
      )}

      {/* Sin canal → botón para mostrar form */}
      {!channel && !showForm && (
        <div className="wa-empty">
          <p>Conecta tu número de WhatsApp Business para recibir mensajes en este bot.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Conectar WhatsApp
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form className="wa-form" onSubmit={handleSave}>
          <div className="form-grid">
            <div className="field full">
              <label>Access Token *</label>
              <input
                name="accessToken"
                value={form.accessToken}
                onChange={handleChange}
                placeholder="EAANde..."
                type="password"
              />
              <span className="hint">Token de la app en Meta for Developers</span>
            </div>
            <div className="field">
              <label>Phone Number ID *</label>
              <input
                name="phoneNumberId"
                value={form.phoneNumberId}
                onChange={handleChange}
                placeholder="106014604..."
              />
            </div>
            <div className="field">
              <label>API Version</label>
              <input
                name="apiVersion"
                value={form.apiVersion}
                onChange={handleChange}
                placeholder="v23.0"
              />
            </div>
            <div className="field full">
              <label>Verify Token *</label>
              <input
                name="verifyToken"
                value={form.verifyToken}
                onChange={handleChange}
                placeholder="mi_verify_token_secreto"
              />
              <span className="hint">Cualquier string secreto — debes usarlo en Meta al configurar el webhook</span>
            </div>
            <div className="field full">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="skipSignatureValidation"
                  checked={form.skipSignatureValidation}
                  onChange={handleChange}
                />
                Omitir validación de firma (útil en desarrollo local)
              </label>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <div className="modal-footer" style={{ padding: '16px 0 0' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setShowForm(false); setError(''); }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : channel ? 'Guardar cambios' : 'Conectar'}
            </button>
          </div>
        </form>
      )}

      {success && !showForm && (
        <p className="form-success" style={{ marginTop: 12 }}>{success}</p>
      )}
    </div>
  );
}