import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { tenantService } from "../../services/tenant.service";
import type { TenantPlan, TenantRecord } from "../../types/tenant.types";
import "./companies.css";

const planOptions: TenantPlan[] = ["BASIC", "PRO", "ENTERPRISE"];

type FormState = {
  id?: string;
  name: string;
  plan: TenantPlan;
};

const emptyForm: FormState = {
  name: "",
  plan: "BASIC",
};

export default function CompaniesPage() {
  const { logout } = useAuth();
  const [companies, setCompanies] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await tenantService.list();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar empresas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return companies;
    return companies.filter((company) => company.name.toLowerCase().includes(normalized));
  }, [companies, query]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError("");

    try {
      if (form.id) {
        await tenantService.update(form.id, { name: form.name.trim(), plan: form.plan });
      } else {
        await tenantService.create({ name: form.name.trim(), plan: form.plan });
      }
      setForm(emptyForm);
      await loadCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la empresa");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("¿Seguro que quieres eliminar esta empresa?");
    if (!confirmed) return;

    setError("");
    try {
      await tenantService.remove(id);
      await loadCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la empresa");
    }
  };

  const handleEdit = (company: TenantRecord) => {
    setForm({
      id: company.id,
      name: company.name,
      plan: company.plan,
    });
  };

  const cancelEdit = () => setForm(emptyForm);

  return (
    <main className="companies-page">
      <header className="companies-header">
        <div>
          <h1>Empresas</h1>
          <p>CRUD completo de empresas (tenant): crear, consultar, actualizar y eliminar.</p>
        </div>
        <div className="companies-actions">
          <Link className="ghost-btn" to="/dashboard">
            Ir al dashboard
          </Link>
          <button className="ghost-btn" type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="companies-grid">
        <article className="panel">
          <h2>{form.id ? "Editar empresa" : "Nueva empresa"}</h2>
          <form onSubmit={handleSubmit} className="company-form">
            <label htmlFor="companyName">Nombre</label>
            <input
              id="companyName"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ej: TechCorp"
              required
            />

            <label htmlFor="companyPlan">Plan</label>
            <select
              id="companyPlan"
              value={form.plan}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, plan: event.target.value as TenantPlan }))
              }
            >
              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? "Guardando..." : form.id ? "Actualizar" : "Crear"}
              </button>
              {form.id && (
                <button type="button" className="ghost-btn" onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </article>

        <article className="panel">
          <div className="list-head">
            <h2>Listado de empresas</h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          {loading ? (
            <p>Cargando empresas...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Plan</th>
                  <th>ID</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <Link to={`/empresas/${company.id}`}>{company.name}</Link>
                    </td>
                    <td>{company.plan}</td>
                    <td className="mono">{company.id}</td>
                    <td className="actions-cell">
                      <button type="button" onClick={() => handleEdit(company)}>
                        Editar
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(company.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4}>No hay empresas para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </article>
      </section>
    </main>
  );
}
