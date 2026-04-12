import { useAppContext } from '../hooks/useAppContext';

export function LogsPage() {
  const { logs } = useAppContext();

  return (
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
  );
}
