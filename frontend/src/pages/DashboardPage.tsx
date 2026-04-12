import { useAppContext } from '../hooks/useAppContext';

export function DashboardPage() {
  const { companies, users, samples, logs } = useAppContext();

  return (
    <section className="grid two">
      <article className="panel">
        <h3>Resumen general</h3>
        <ul>
          <li>Empresas: {companies.length}</li>
          <li>Usuarios activos: {users.filter((user) => user.status === 'active').length}</li>
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
  );
}
