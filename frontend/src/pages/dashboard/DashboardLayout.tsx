import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  role: "system" | "tenant" | "user";
};

export default function DashboardLayout({
  title,
  description,
  children,
  role,
}: Props) {
  const { logout, user } = useAuth();
  return (
    <main className="overview-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">O</span>
          <div>
            <h1>OmniSphere</h1>
            <p>{user?.name ?? "AI Platform"}</p>
          </div>
        </div>

        <nav>
          <p className="menu-label">GENERAL</p>
          <Link className="menu-item active" to="/dashboard">
            Overview
          </Link>

          {role === "system" && (
            <Link className="menu-item" to="/company">
              Empresas ↗
            </Link>
          )}

          {role === "tenant" && (
            <Link className="menu-item" to="/company">
              Mi empresa ↗
            </Link>
          )}

          <Link className="menu-item" to="/bots">
            Bots ↗
          </Link>

          {role === "system" && (
            <>
              <p className="menu-label">SISTEMA</p>
              <Link className="menu-item" to="/config">
                Config ↗
              </Link>
              <Link className="menu-item" to="/api-keys">
                API Keys ↗
              </Link>
            </>
          )}
        </nav>
        <div style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="menu-item"
            onClick={() => logout()}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <section className="overview-content">
        <header className="overview-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}