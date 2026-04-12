import { UserRole } from '../types';
import { useAppContext } from '../hooks/useAppContext';

export function UsersPage() {
  const { currentTenantUsers, inviteUser } = useAppContext();

  return (
    <section className="panel">
      <h3>CRUD de usuarios</h3>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const fullName = String(data.get('fullName') ?? '');
          const email = String(data.get('email') ?? '');
          const role = String(data.get('role') ?? 'Agent') as UserRole;
          if (!fullName || !email) return;

          inviteUser({ fullName, email, role });
          event.currentTarget.reset();
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
  );
}
