import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { tenantService } from "../../services/tenant.service";
import type { TenantPlan, TenantRecord } from "../../types/tenant.types";
import { getApiErrorMessage } from "../../utils/apiError";
import "./companies.css";

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

  const isSystemAdmin = useMemo(
    () => !!user?.roles?.includes("ADMIN_SISTEMA"),
    [user?.roles],
  );

  const canEditMyTenant = useMemo(
    () =>
      !!user?.roles?.some(
        (role) => role === "ADMIN_TENANT" || role === "ADMIN_SISTEMA",
      ),
    [user?.roles],
  );

  const canCreateTenants = isSystemAdmin;
  const canDeleteTenants = isSystemAdmin;

  const pageTitle = isSystemAdmin ? "Empresas" : "Mi empresa";
  const pageDescription = isSystemAdmin
    ? "Administración completa de tenants del sistema."
    : "Consulta y actualización de la empresa asociada a tu cuenta.";

  const formTitle = form.id
    ? "Editar empresa"
    : isSystemAdmin
      ? "Nueva empresa"
      : "Mi empresa";

  const listTitle = isSystemAdmin ? "Listado de empresas" : "Datos de mi empresa";

  const canEditCompany = (company: TenantRecord): boolean => {
    if (isSystemAdmin) return true;
    return company.id === user?.tenantId;
  };

  const loadCompanies = async (): Promise<TenantRecord[]> => {
    setLoading(true);

    try {
      if (isSystemAdmin) {
        const data = await tenantService.list();
        const safeData = Array.isArray(data) ? data : [];
        setCompanies(safeData);
        return safeData;
      }

      const myTenant = await tenantService.getMyTenant();
      const safeData = myTenant ? [myTenant] : [];
      setCompanies(safeData);
      return safeData;
    } catch (error: unknown) {
      setAlert({
        tone: "error",
        message: getApiErrorMessage(
          error,
          "No se pudo cargar la información de la empresa.",
        ),
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, [isSystemAdmin]);

  useEffect(() => {
    if (!form.id && !isSystemAdmin && companies.length > 0) {
      const myCompany = companies[0];
      setForm({
        id: myCompany.id,
        name: myCompany.name,
        plan: myCompany.plan,
      });
    }
  }, [companies, isSystemAdmin, form.id]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return companies;

    return companies.filter((company) =>
      company.name.toLowerCase().includes(normalized),
    );
  }, [companies, query]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateCompanyName(form.name);
    setNameError(validationError);

    if (validationError) {
      setAlert({
        tone: "error",
        message: "No se pudo guardar. Corrige los errores del formulario.",
      });
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      if (form.id) {
        const currentCompany = companies.find((company) => company.id === form.id);

        if (!currentCompany) {
          throw new Error("La empresa seleccionada no existe.");
        }

        if (!canEditCompany(currentCompany)) {
          throw new Error("No tienes permisos para editar esta empresa.");
        }

        if (isSystemAdmin) {
          await tenantService.update(form.id, {
            name: form.name.trim(),
            plan: form.plan,
          });
        } else {
          await tenantService.updateMyTenant({
            name: form.name.trim(),
            plan: form.plan,
          });
        }

        const refreshedCompanies = await loadCompanies();

        if (isSystemAdmin) {
          const updatedCompany = refreshedCompanies.find(
            (company) => company.id === form.id,
          );

          if (updatedCompany) {
            setForm({
              id: updatedCompany.id,
              name: updatedCompany.name,
              plan: updatedCompany.plan,
            });
          }
        } else {
          const myCompany = refreshedCompanies[0];

          if (myCompany) {
            setForm({
              id: myCompany.id,
              name: myCompany.name,
              plan: myCompany.plan,
            });
          }
        }

        setAlert({
          tone: "success",
          message: "Empresa actualizada correctamente.",
        });
      } else {
        if (!canCreateTenants) {
          throw new Error("No tienes permisos para crear empresas.");
        }

        await tenantService.create({
          name: form.name.trim(),
          plan: form.plan,
        });

        const refreshedCompanies = await loadCompanies();

        if (isSystemAdmin) {
          setForm(emptyForm);
        } else {
          const myCompany = refreshedCompanies[0];

          if (myCompany) {
            setForm({
              id: myCompany.id,
              name: myCompany.name,
              plan: myCompany.plan,
            });
          }
        }

        setAlert({
          tone: "success",
          message: "Empresa creada correctamente.",
        });
      }

      setNameError("");
    } catch (error: unknown) {
      setAlert({
        tone: "error",
        message: getApiErrorMessage(
          error,
          form.id
            ? "No se pudo actualizar la empresa."
            : "No se pudo crear la empresa.",
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company: TenantRecord) => {
    if (!canDeleteTenants) {
      setAlert({
        tone: "error",
        message: "No tienes permisos para eliminar empresas.",
      });
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar la empresa "${company.name}"?`,
    );

    if (!confirmed) return;

    try {
      await tenantService.remove(company.id);
      setAlert({
        tone: "success",
        message: "Empresa eliminada correctamente.",
      });

      if (form.id === company.id) {
        setForm(emptyForm);
        setNameError("");
      }

      await loadCompanies();
    } catch (error: unknown) {
      setAlert({
        tone: "error",
        message: getApiErrorMessage(
          error,
          "No se pudo eliminar la empresa.",
        ),
      });
    }
  };

  const handleEdit = (company: TenantRecord) => {
    if (!canEditCompany(company)) {
      setAlert({
        tone: "error",
        message: "No tienes permisos para editar esta empresa.",
      });
      return;
    }

    setForm({
      id: company.id,
      name: company.name,
      plan: company.plan,
    });

    setNameError("");
    setAlert({
      tone: "info",
      message: `Editando empresa: ${company.name}`,
    });
  };

  const cancelEdit = () => {
    if (isSystemAdmin) {
      setForm(emptyForm);
      setNameError("");
      setAlert({ tone: "info", message: "Edición cancelada." });
      return;
    }

    const myCompany = companies[0];

    if (myCompany) {
      setForm({
        id: myCompany.id,
        name: myCompany.name,
        plan: myCompany.plan,
      });
    } else {
      setForm(emptyForm);
    }

    setNameError("");
    setAlert({ tone: "info", message: "Edición cancelada." });
  };

  return (
    <main className="companies-page">
      <header className="companies-header">
        <div>
          <h1>{pageTitle}</h1>
          <p>{pageDescription}</p>
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
          <h2>{formTitle}</h2>

          {!isSystemAdmin && (
            <p className="helper-text">
              Solo puedes editar la empresa asociada a tu cuenta.
            </p>
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
              disabled={!isSystemAdmin && !canEditMyTenant}
            />
            {nameError && <small className="field-error">{nameError}</small>}

            <label htmlFor="companyPlan">Plan</label>
            <select
              id="companyPlan"
              value={form.plan}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  plan: event.target.value as TenantPlan,
                }))
              }
              disabled={!isSystemAdmin && !canEditMyTenant}
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
                  (!!form.id &&
                    companies.length > 0 &&
                    !companies.some(
                      (company) => company.id === form.id && canEditCompany(company),
                    ))
                }
              >
                {saving ? "Guardando..." : form.id ? "Actualizar" : "Crear"}
              </button>

              {form.id && (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={cancelEdit}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </article>

        <article className="panel">
          <div className="list-head">
            <h2>{listTitle}</h2>

            {isSystemAdmin && (
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre"
              />
            )}
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
                      {isSystemAdmin ? (
                        <Link to={`/empresas/${company.id}`}>{company.name}</Link>
                      ) : (
                        company.name
                      )}
                    </td>
                    <td>{company.plan}</td>
                    <td className="mono">{company.id}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        onClick={() => handleEdit(company)}
                        disabled={!canEditCompany(company)}
                      >
                        Editar
                      </button>

                      {isSystemAdmin && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDelete(company)}
                        >
                          Eliminar
                        </button>
                      )}
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