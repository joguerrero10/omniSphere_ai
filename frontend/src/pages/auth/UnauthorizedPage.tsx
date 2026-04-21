import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./UnauthorizedPage.css";
import { authStorage } from "./storage/auth.storage";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    authStorage.clear();   // limpia localStorage
    logout();              // limpia el contexto en memoria
    navigate("/login");
  };

  return (
    <main className="unauth-page">
      <div className="unauth-card">

        {/* Icono animado */}
        <div className="shield-wrap">
          <div className="shield-pulse" />
          <div className="shield-bg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="15" r="1" fill="#534AB7" stroke="none" />
            </svg>
          </div>
        </div>

        <span className="err-code">Error 403 · Acceso denegado</span>
        <h1 className="err-title">No tienes permiso para ver esta página</h1>
        <p className="err-desc">
          Tu rol actual no incluye acceso a este recurso.
          Si crees que esto es un error, contacta a tu administrador.
        </p>

        <div className="err-actions">
          <Link to="/dashboard" className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Volver al dashboard
          </Link>

          <div className="err-secondary-actions">
            <Link to="/request-access" className="btn-ghost">
              Solicitar acceso
            </Link>
            <div className="btn-divider" />
            <button className="btn-ghost" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="err-meta">
          <div className="meta-dot" />
          OmniSphere AI Platform · acceso denegado
        </div>
      </div>
    </main>
  );
}