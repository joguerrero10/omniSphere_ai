import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WARN_SECONDS = 5 * 60;
const CHECK_INTERVAL = 10_000;

interface Props { children: React.ReactNode; }

function getTokenExp(): number | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function getRemainingSeconds(exp: number): number {
  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api`;

async function refreshToken(): Promise<boolean> {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const newToken = data.access_token ?? data.accessToken ?? data.token;
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function logout(navigate: ReturnType<typeof useNavigate>) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('authUser');
  localStorage.removeItem('tenantId');
  localStorage.removeItem('tenants');
  navigate('/login', { replace: true });
}

export function SessionGuard({ children }: Props) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => {
      const exp = getTokenExp();

      // Sin token → logout inmediato
      if (!exp) {
        logout(navigate);
        return;
      }

      const secs = getRemainingSeconds(exp);

      // Token expirado → logout inmediato
      if (secs === 0) {
        logout(navigate);
        return;
      }

      setRemaining(secs);

      // Mostrar modal cuando queden menos de WARN_SECONDS
      if (secs <= WARN_SECONDS) {
        setShowModal(true);
      }
    };

    // Verificar inmediatamente
    check();

    // Verificar cada CHECK_INTERVAL
    intervalRef.current = setInterval(check, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [navigate]);

  // Countdown en el modal — actualiza cada segundo
  useEffect(() => {
    if (!showModal) return;
    const t = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(t);
          logout(navigate);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [showModal, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshFailed(false);
    const ok = await refreshToken();
    if (ok) {
      setShowModal(false);
      setRefreshing(false);
      // Reiniciar el remaining con el nuevo token
      const exp = getTokenExp();
      if (exp) setRemaining(getRemainingSeconds(exp));
    } else {
      setRefreshFailed(true);
      setRefreshing(false);
    }
  };

  const handleLogout = () => logout(navigate);

  const urgent = remaining !== null && remaining <= 60;

  return (
    <>
      {children}

      {showModal && remaining !== null && (
        <div className="session-overlay">
          <div className={`session-modal ${urgent ? 'session-modal--urgent' : ''}`}>
            {/* Icon */}
            <div className="session-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="session-title">Sesión por expirar</h2>
            <p className="session-desc">
              Tu sesión cerrará automáticamente en
            </p>

            {/* Countdown */}
            <div className={`session-countdown ${urgent ? 'session-countdown--urgent' : ''}`}>
              {formatCountdown(remaining)}
            </div>

            {/* Progress bar */}
            <div className="session-progress-track">
              <div
                className={`session-progress-bar ${urgent ? 'session-progress-bar--urgent' : ''}`}
                style={{ width: `${Math.min(100, (remaining / WARN_SECONDS) * 100)}%` }}
              />
            </div>

            {refreshFailed && (
              <p className="session-error">
                No se pudo renovar la sesión. Por favor inicia sesión nuevamente.
              </p>
            )}

            {/* Actions */}
            <div className="session-actions">
              <button className="session-btn-ghost" onClick={handleLogout}>
                Cerrar sesión
              </button>
              <button
                className="session-btn-primary"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <><span className="session-spinner" /> Renovando...</>
                ) : (
                  '↻ Continuar sesión'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}