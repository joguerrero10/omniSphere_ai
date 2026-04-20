import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { tenantService } from "../../services/tenant.service";
import type { TenantRecord } from "../../types/tenant.types";
import { getApiErrorMessage } from "../../utils/apiError";
import "./companies.css";

export default function CompanyDetailPage() {
  const { id = "" } = useParams();
  const [company, setCompany] = useState<TenantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await tenantService.getById(id);
        setCompany(data);
      } catch (error: unknown) {
        setError(getApiErrorMessage(error, "No se pudo obtener la empresa"));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void run();
    }
  }, [id]);

  return (
    <main className="companies-page">
      <header className="companies-header">
        <div>
          <h1>Detalle de empresa</h1>
          <p>Vista de detalle para la empresa seleccionada.</p>
        </div>
        <div className="companies-actions">
          <Link className="ghost-btn" to="/empresas">
            Volver
          </Link>
        </div>
      </header>

      <section className="panel company-detail">
        {loading && <p>Cargando detalle...</p>}
        {!loading && error && <p className="error-msg">{error}</p>}
        {!loading && company && (
          <dl>
            <div>
              <dt>ID</dt>
              <dd className="mono">{company.id}</dd>
            </div>
            <div>
              <dt>Nombre</dt>
              <dd>{company.name}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{company.plan}</dd>
            </div>
            <div>
              <dt>Creado</dt>
              <dd>{company.createdAt ? new Date(company.createdAt).toLocaleString() : "N/A"}</dd>
            </div>
            <div>
              <dt>Actualizado</dt>
              <dd>{company.updatedAt ? new Date(company.updatedAt).toLocaleString() : "N/A"}</dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  );
}
