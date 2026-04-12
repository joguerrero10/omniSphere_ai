import { Plan } from '../types';
import { useAppContext } from '../hooks/useAppContext';

export function CompaniesPage() {
  const { companies, createCompany, toggleCompanyStatus } = useAppContext();

  return (
    <section className="panel">
      <h3>CRUD de empresas</h3>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const name = String(data.get('name') ?? '');
          const slug = String(data.get('slug') ?? '');
          const plan = String(data.get('plan') ?? 'Starter') as Plan;
          if (!name || !slug) return;

          createCompany({ name, slug, plan });
          event.currentTarget.reset();
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
                <button type="button" onClick={() => toggleCompanyStatus(company.id)}>
                  Pausar/Activar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
