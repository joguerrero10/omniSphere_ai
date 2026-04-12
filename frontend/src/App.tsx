import { useMemo, useState } from 'react';

type Plan = 'Starter' | 'Growth' | 'Enterprise';
type UserRole = 'Owner' | 'Admin' | 'Analyst' | 'Agent';
type FlowNodeType = 'trigger' | 'message' | 'condition' | 'action';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  activeUsers: number;
  status: 'active' | 'paused';
};

type AppUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  tenantId: string;
  status: 'active' | 'invited' | 'suspended';
};

type FlowNode = {
  id: string;
  label: string;
  type: FlowNodeType;
  next: string[];
};

type TrainingSample = {
  id: string;
  intent: string;
  phrase: string;
};

type LogItem = {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  area: string;
  message: string;
  timestamp: string;
};

const id = () => crypto.randomUUID().slice(0, 8);

function App() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'empresas' | 'usuarios' | 'flujos' | 'ia' | 'logs'>('dashboard');

  const [companies, setCompanies] = useState<Tenant[]>([
    { id: 't-acme', name: 'Acme Retail', slug: 'acme', plan: 'Growth', activeUsers: 14, status: 'active' },
    { id: 't-orbit', name: 'Orbit Logistics', slug: 'orbit', plan: 'Starter', activeUsers: 5, status: 'active' },
  ]);

  const [users, setUsers] = useState<AppUser[]>([
    { id: 'u1', fullName: 'Laura Torres', email: 'laura@acme.ai', role: 'Owner', tenantId: 't-acme', status: 'active' },
    { id: 'u2', fullName: 'Diego Ruiz', email: 'diego@acme.ai', role: 'Analyst', tenantId: 't-acme', status: 'active' },
    { id: 'u3', fullName: 'Paz Moreno', email: 'paz@orbit.ai', role: 'Admin', tenantId: 't-orbit', status: 'invited' },
  ]);

  const [flowName, setFlowName] = useState('Onboarding cliente web');
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([
    { id: 'n1', label: 'Webhook recibido', type: 'trigger', next: ['n2'] },
    { id: 'n2', label: 'Mensaje bienvenida', type: 'message', next: ['n3'] },
    { id: 'n3', label: '¿Tiene cuenta?', type: 'condition', next: ['n4'] },
    { id: 'n4', label: 'Asignar agente', type: 'action', next: [] },
  ]);

  const [samples, setSamples] = useState<TrainingSample[]>([
    { id: 's1', intent: 'saludo', phrase: 'hola, necesito ayuda con mi pedido' },
    { id: 's2', intent: 'estado_pedido', phrase: '¿dónde está mi compra?' },
  ]);

  const [logs, setLogs] = useState<LogItem[]>([
    { id: 'l1', level: 'INFO', area: 'Auth', message: 'Login exitoso en tenant acme', timestamp: '2026-04-12 09:30 UTC' },
    { id: 'l2', level: 'WARN', area: 'Flows', message: 'Nodo sin salida detectado en flujo de soporte', timestamp: '2026-04-12 09:51 UTC' },
  ]);

  const currentTenantUsers = useMemo(
    () => users.filter((u) => !tenant || u.tenantId === tenant.id),
    [tenant, users],
  );

  const appendLog = (entry: Omit<LogItem, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      {
        id: id(),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        ...entry,
      },
      ...prev,
    ]);
  };

  if (!tenant) {
    return (
      <main className="page centered">
        <section className="panel login-panel">
          <h1>OmniSphere AI</h1>
          <p>Login multiempresa (FASE 2 Frontend)</p>
          <div className="field">
            <label>Empresa</label>
            <select onChange={(e) => setTenant(companies.find((c) => c.id === e.target.value) ?? null)} defaultValue="">
              <option value="" disabled>
                Selecciona una empresa
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} · {company.plan}
                </option>
              ))}
            </select>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <aside className="sidebar">
        <h2>OmniSphere</h2>
        <p className="tenant-pill">{tenant.name}</p>
        {[
          ['dashboard', 'Dashboard'],
          ['empresas', 'Empresas'],
          ['usuarios', 'Usuarios'],
          ['flujos', 'Editor de flujos'],
          ['ia', 'Entrenamiento IA'],
          ['logs', 'Logs y mensajes'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={activeView === key ? 'active' : ''}
            onClick={() => setActiveView(key as typeof activeView)}
            type="button"
          >
            {label}
          </button>
        ))}

        <button
          type="button"
          className="logout"
          onClick={() => {
            appendLog({ level: 'INFO', area: 'Auth', message: `Logout de tenant ${tenant.slug}` });
            setTenant(null);
          }}
        >
          Cerrar sesión
        </button>
      </aside>

      <section className="content">
        {activeView === 'dashboard' && (
          <section className="grid two">
            <article className="panel">
              <h3>Resumen general</h3>
              <ul>
                <li>Empresas: {companies.length}</li>
                <li>Usuarios activos: {users.filter((u) => u.status === 'active').length}</li>
                <li>Flujos definidos: 1</li>
                <li>Muestras IA: {samples.length}</li>
              </ul>
            </article>
            <article className="panel">
              <h3>Mensajes recientes</h3>
              {logs.slice(0, 4).map((log) => (
                <p key={log.id}>
                  <strong>{log.level}</strong> · {log.message}
                </p>
              ))}
            </article>
          </section>
        )}

        {activeView === 'empresas' && (
          <section className="panel">
            <h3>CRUD de empresas</h3>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const name = String(data.get('name') ?? '');
                const slug = String(data.get('slug') ?? '');
                const plan = String(data.get('plan') ?? 'Starter') as Plan;
                if (!name || !slug) return;

                const newCompany: Tenant = {
                  id: `t-${id()}`,
                  name,
                  slug,
                  plan,
                  activeUsers: 0,
                  status: 'active',
                };
                setCompanies((prev) => [...prev, newCompany]);
                appendLog({ level: 'INFO', area: 'Tenants', message: `Empresa creada: ${name}` });
                e.currentTarget.reset();
              }}
            >
              <input name="name" placeholder="Nombre" required />
              <input name="slug" placeholder="slug" required />
              <select name="plan" defaultValue="Starter">
                <option>Starter</option>
                <option>Growth</option>
                <option>Enterprise</option>
              </select>
              <button type="submit">Crear empresa</button>
            </form>

            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.name}</td>
                    <td>{company.plan}</td>
                    <td>{company.status}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setCompanies((prev) =>
                            prev.map((c) =>
                              c.id === company.id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c,
                            ),
                          );
                        }}
                      >
                        Pausar/Activar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeView === 'usuarios' && (
          <section className="panel">
            <h3>CRUD de usuarios</h3>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const fullName = String(data.get('fullName') ?? '');
                const email = String(data.get('email') ?? '');
                const role = String(data.get('role') ?? 'Agent') as UserRole;
                if (!fullName || !email) return;

                setUsers((prev) => [
                  ...prev,
                  {
                    id: `u-${id()}`,
                    fullName,
                    email,
                    role,
                    tenantId: tenant.id,
                    status: 'invited',
                  },
                ]);
                appendLog({ level: 'INFO', area: 'Users', message: `Invitación enviada a ${email}` });
                e.currentTarget.reset();
              }}
            >
              <input name="fullName" placeholder="Nombre completo" required />
              <input name="email" type="email" placeholder="Email" required />
              <select name="role" defaultValue="Agent">
                <option>Owner</option>
                <option>Admin</option>
                <option>Analyst</option>
                <option>Agent</option>
              </select>
              <button type="submit">Invitar usuario</button>
            </form>

            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {currentTenantUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeView === 'flujos' && (
          <section className="panel">
            <h3>Editor de flujos</h3>
            <input value={flowName} onChange={(e) => setFlowName(e.target.value)} />
            <div className="grid two">
              <div>
                <h4>Nodos</h4>
                <ul>
                  {flowNodes.map((node) => (
                    <li key={node.id}>
                      <strong>{node.type}</strong> · {node.label}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setFlowNodes((prev) => [
                      ...prev,
                      {
                        id: `n-${id()}`,
                        label: `Nuevo nodo ${prev.length + 1}`,
                        type: 'message',
                        next: [],
                      },
                    ]);
                  }}
                >
                  Agregar nodo
                </button>
              </div>
              <div>
                <h4>Conexiones (vista simple)</h4>
                {flowNodes.map((node) => (
                  <p key={`${node.id}-edge`}>
                    {node.id} → {node.next.join(', ') || 'sin salida'}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeView === 'ia' && (
          <section className="panel">
            <h3>Entrenamiento IA en panel</h3>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const intent = String(data.get('intent') ?? '');
                const phrase = String(data.get('phrase') ?? '');
                if (!intent || !phrase) return;
                setSamples((prev) => [...prev, { id: `s-${id()}`, intent, phrase }]);
                appendLog({ level: 'INFO', area: 'NLU', message: `Nueva muestra para intent ${intent}` });
                e.currentTarget.reset();
              }}
            >
              <input name="intent" placeholder="Intent" required />
              <input name="phrase" placeholder="Frase de entrenamiento" required />
              <button type="submit">Agregar muestra</button>
            </form>
            <button
              type="button"
              onClick={() => appendLog({ level: 'INFO', area: 'NLU', message: `Entrenamiento lanzado con ${samples.length} muestras` })}
            >
              Ejecutar entrenamiento
            </button>

            <ul>
              {samples.map((sample) => (
                <li key={sample.id}>
                  <strong>{sample.intent}</strong>: {sample.phrase}
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeView === 'logs' && (
          <section className="panel">
            <h3>Logs y mensajes</h3>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nivel</th>
                  <th>Área</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.timestamp}</td>
                    <td>{log.level}</td>
                    <td>{log.area}</td>
                    <td>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
