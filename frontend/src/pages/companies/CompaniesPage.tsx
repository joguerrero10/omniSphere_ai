import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { tenantService } from "../../services/tenant.service";
import type { TenantPlan, TenantRecord } from "../../types/tenant.types";
import "./companies.css";
import { getApiErrorMessage } from "../../utils/apiError";

const planOptions: TenantPlan[] = ["FREE", "PRO", "ENTERPRISE"];

type FormState = {
  id?: string;
  name: string;
  plan: TenantPlan;
};

type AlertState = {
  tone: "success" | "error" | "info";
  message: string;
};

const emptyForm: FormState = {
  name: "",
  plan: "FREE",
};

const validateCompanyName = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "El nombre es obligatorio.";
  if (trimmed.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (trimmed.length > 120) return "El nombre no puede superar 120 caracteres.";
  return "";
};

export default function CompaniesPage() {
  const { logout, user } = useAuth();
  const [companies, setCompanies] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [nameError, setNameError] = useState<string>("");
  const [alert, setAlert] = useState<AlertState | null>(null);

  const canManageTenants = useMemo(
    () => !!user?.roles?.includes("ADMIN_SISTEMA"),
    [user?.roles],
  );
  const canCreateTenants = useMemo(
    () => !!user?.roles?.some((role) => role === "ADMIN_TENANT" || role === "ADMIN_SISTEMA"),
    [user?.roles],
  );
  const canEditMyTenant = useMemo(
    () => !!user?.roles?.some((role) => role === "ADMIN_TENANT" || role === "ADMIN_SISTEMA"),
    [user?.roles],
  );

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await tenantService.list();
      setCompanies(data);
    } catch (error: unknown) {
      setAlert({
        tone: "error",
        message: getApiErrorMessage(error, "No se pudo cargar el listado de empresas."),
      });
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

    const validationError = validateCompanyName(form.name);
    setNameError(validationError);

    if (validationError) {
      setAlert({ tone: "error", message: "No se pudo guardar. Corrige los errores del formulario." });
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      if (form.id) {
        await tenantService.update(form.id, { name: form.name.trim(), plan: form.plan });
        setAlert({ tone: "success", message: "Empresa actualizada correctamente." });
      } else {
        if (!canCreateTenants) {
          throw new Error("No tienes permisos para crear empresas.");
        }
        await tenantService.create({ name: form.name.trim(), plan: form.plan });
        setAlert({ tone: "success", message: "Empresa creada correctamente." });
      }

      setForm(emptyForm);
      setNameError("");
      await loadCompanies();
    } catch (error: unknown) {
      setAlert({
        tone: "error",
        message: getApiErrorMessage(error, "Empresa no creada. Inténtalo nuevamente."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("¿Seguro que quieres eliminar esta empresa?");
    if (!confirmed) return;

    setAlert(null);

    try {
      await tenantService.remove(id);
      setAlert({ tone: "success", message: "Empresa eliminada correctamente." });
      await loadCompanies();
    } catch (error: unknown) {
      setAlert({
        tone: "error",
        message: getApiErrorMessage(error, "Empresa no eliminada. Inténtalo nuevamente."),
      });
    }
  };

  const handleEdit = (company: TenantRecord) => {
    setForm({
      id: company.id,
      name: company.name,
      plan: company.plan,
    });
    setNameError("");
    setAlert({ tone: "info", message: `Editando empresa: ${company.name}` });
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setNameError("");
    setAlert({ tone: "info", message: "Edición cancelada." });
  };

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

      {alert && <p className={`alert ${alert.tone}`}>{alert.message}</p>}

      <section className="companies-grid">
        <article className="panel">
          <h2>{form.id ? "Editar empresa" : canManageTenants ? "Nueva empresa" : "Empresa"}</h2>
          {!canCreateTenants && !canEditMyTenant && (
            <p className="error-msg">No tienes permisos para crear/editar empresas.</p>
          )}
          <form onSubmit={handleSubmit} className="company-form">
            <label htmlFor="companyName">Nombre</label>
            <input
              id="companyName"
              value={form.name}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, name: value }));
                setNameError(validateCompanyName(value));
              }}
              placeholder="Ej: TechCorp"
              required
              disabled={!canCreateTenants && !canEditMyTenant}
            />
            {nameError && <small className="field-error">{nameError}</small>}

            <label htmlFor="companyPlan">Plan</label>
            <select
              id="companyPlan"
              value={form.plan}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, plan: event.target.value as TenantPlan }))
              }
              disabled={!canCreateTenants && !canEditMyTenant}
            >
              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>

            <div className="form-actions">
              <button
                type="submit"
                disabled={
                  saving ||
                  (!form.id && !canCreateTenants) ||
                  (!!form.id && !canManageTenants && !canEditMyTenant)
                }
              >
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
