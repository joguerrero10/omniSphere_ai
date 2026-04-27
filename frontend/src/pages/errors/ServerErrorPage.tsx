import { useNavigate } from "react-router-dom";
import './error-pages.css';

export function ServerErrorPage() {
  const navigate = useNavigate();
  return (
    <div className="ep-root ep-root--500">
      <div className="ep-grid" />
      <div className="ep-glow ep-glow--red" />
      <div className="ep-content">
        <div className="ep-code-wrap">
          <span className="ep-code">500</span>
        </div>
        <div className="ep-badge"><span className="ep-badge-dot" />Error del servidor</div>
        <h1 className="ep-title">Algo salió mal</h1>
        <p className="ep-desc">
          Ocurrió un error inesperado en el servidor.<br />
          Nuestro equipo está trabajando en solucionarlo.
        </p>
        <div className="ep-actions">
          <button className="ep-btn ep-btn--ghost" onClick={() => window.location.reload()}>↻ Reintentar</button>
          <button className="ep-btn ep-btn--primary" onClick={() => navigate('/dashboard')}>
            Ir al Dashboard
          </button>
        </div>
        <p className="ep-footer">OmniSphere AI Platform · Error 500</p>
      </div>
    </div>
  );
}