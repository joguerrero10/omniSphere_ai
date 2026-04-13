import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/login.css"; // Asegúrate de tener este archivo con los estilos necesarios
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, tenants, activeTenant } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      if (tenants.length > 1 && !activeTenant) {
        navigate("/select-tenant");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Credenciales inválidas";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>

      <div className="login-root">
        <div className="login-left">
          <div className="brand">
            <div className="brand-icon">⚡</div>
            <span className="brand-name">OmniSphere AI</span>
          </div>

          <div className="left-headline">
            <h2>Inteligencia sin límites para tu empresa</h2>
            <p>
              Gestiona todos tus espacios de trabajo desde un solo lugar. Potenciado por IA.
            </p>
          </div>

          <div className="left-footer">
            © {new Date().getFullYear()} OmniSphere AI. Todos los derechos reservados.
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-card-header">
              <p className="eyebrow">Bienvenido de vuelta</p>
              <h1>Inicia sesión</h1>
              <p>Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <div className="input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <div className="input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    autoComplete="current-password"
                    data-lpignore="true"
                    data-form-type="other"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={submitting}>
                {submitting ? (
                  <><div className="spinner" /> Ingresando...</>
                ) : (
                  "Entrar"
                )}
              </button>

              {error && (
                <div className="error-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
            </form>

            <div className="login-footer">
              ¿No tienes cuenta? <a href="#">Contacta a tu administrador</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}