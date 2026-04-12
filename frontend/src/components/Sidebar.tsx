import { NAV_ITEMS } from '../store/navigation';
import { useAppContext } from '../hooks/useAppContext';

export function Sidebar() {
  const { tenant, activeView, setActiveView, logout } = useAppContext();

  return (
    <aside className="sidebar">
      <h2>OmniSphere</h2>
      <p className="tenant-pill">{tenant?.name}</p>

      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={activeView === item.key ? 'active' : ''}
          onClick={() => setActiveView(item.key)}
        >
          {item.label}
        </button>
      ))}

      <button type="button" className="logout" onClick={logout}>
        Cerrar sesión
      </button>
    </aside>
  );
}
