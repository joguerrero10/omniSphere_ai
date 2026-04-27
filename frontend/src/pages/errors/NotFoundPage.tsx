import { useNavigate } from 'react-router-dom';
import './error-pages.css';
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="ep-root ep-root--404">
      <div className="ep-grid" />
      <div className="ep-glow ep-glow--purple" />
      <div className="ep-content">
        <div className="ep-code-wrap">
          <span className="ep-code">404</span>
        </div>
        <div className="ep-badge"><span className="ep-badge-dot" />Página no encontrada</div>
        <h1 className="ep-title">Nada por aquí</h1>
        <p className="ep-desc">
          La página que buscas no existe o fue movida<br />
          a otra dirección.
        </p>
        <div className="ep-actions">
          <button className="ep-btn ep-btn--ghost" onClick={() => navigate(-1)}>← Volver</button>
          <button className="ep-btn ep-btn--primary" onClick={() => navigate('/dashboard')}>
            Ir al Dashboard
          </button>
        </div>
        <p className="ep-footer">OmniSphere AI Platform · Error 404</p>
      </div>
    </div>
  );
}