import { useAppContext } from '../hooks/useAppContext';

export function LoginScreen() {
  const { companies, setTenantById } = useAppContext();

  return (
    <main className="page centered">
      <section className="panel login-panel">
        <h1>OmniSphere AI</h1>
        <p>Login multiempresa (FASE 2 Frontend)</p>
        <div className="field">
          <label>Empresa</label>
          <select onChange={(event) => setTenantById(event.target.value)} defaultValue="">
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
