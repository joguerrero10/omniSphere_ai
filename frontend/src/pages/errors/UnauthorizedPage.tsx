import { useNavigate } from "react-router-dom";
import './error-pages.css';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="ep-root ep-root--401">
      <div className="ep-grid" />
      <div className="ep-glow ep-glow--yellow" />
      <div className="ep-content">
        <div className="ep-code-wrap">
          <span className="ep-code">401</span>
        </div>
        <div className="ep-badge"><span className="ep-badge-dot" />No autenticado</div>
        <h1 className="ep-title">Sesión requerida</h1>
        <p className="ep-desc">
          Necesitas iniciar sesión para acceder a esta sección.<br />
          Tu sesión puede haber expirado.
        </p>
        <div className="ep-actions">
          <button className="ep-btn ep-btn--primary" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
        <p className="ep-footer">OmniSphere AI Platform · Error 401</p>
      </div>
    </div>
  );
}
