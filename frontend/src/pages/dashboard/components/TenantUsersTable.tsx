type TenantUser = {
  name: string;
  role: string;
  conversations: string;
  status: string;
};

type Props = {
  title: string;
  rows: TenantUser[];
};

export default function TenantUsersTable({ title, rows }: Props) {
  return (
    <article className="panel">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Conv.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.role}</td>
              <td>{row.conversations}</td>
              <td>
                <span className={`status ${row.status.toLowerCase()}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}