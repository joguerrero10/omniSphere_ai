import { useNavigate } from 'react-router-dom';
import './error-pages.css';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    ['accessToken', 'authUser', 'tenantId', 'tenants'].forEach(k => localStorage.removeItem(k));
    navigate('/login', { replace: true });
  };

  return (
    <div className="ep-root ep-root--403">
      <div className="ep-grid" />
      <div className="ep-glow ep-glow--yellow" />
      <div className="ep-content">
        <div className="ep-code-wrap">
          <span className="ep-code">403</span>
        </div>
        <div className="ep-badge"><span className="ep-badge-dot" />Acceso denegado</div>
        <h1 className="ep-title">Sin permiso</h1>
        <p className="ep-desc">
          Tu rol actual no tiene acceso a este recurso.<br />
          Si crees que es un error, contacta a tu administrador.
        </p>
        <div className="ep-actions">
          <button className="ep-btn ep-btn--ghost" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <button className="ep-btn ep-btn--outline" onClick={() => navigate(-1)}>Volver</button>
          <button className="ep-btn ep-btn--danger" onClick={handleLogout}>Cerrar sesión</button>
        </div>
        <p className="ep-footer">OmniSphere AI Platform · Error 403</p>
      </div>
    </div>
  );
}