import DashboardLayout from "./DashboardLayout";
import BotListPanel from "./components/BotListPanel";
import DonutPanel from "./components/DonutPanel";
import KpiGrid from "./components/KpiGrid";
import LineChartPanel from "./components/LineChartPanel";
import TenantUsersTable from "./components/TenantUsersTable";

import "./dashboard.css";
import {
  dayLabels,
  tenantInitiatedSeries,
  tenantKpis,
  tenantResolvedSeries,
  tenantTopBots,
  tenantUsers,
} from "./dashboard.data";

export default function TenantAdminDashboard() {
  return (
    <DashboardLayout
      role="tenant"
      title="Overview de mi empresa"
      description="Actividad de tu empresa · Última actualización: hoy, 10:42 AM"
    >
      <KpiGrid items={tenantKpis} />

      <section className="charts-grid">
        <LineChartPanel
          title="Conversaciones de mi empresa"
          subtitle="últimos 14 días"
          labels={dayLabels}
          initiatedSeries={tenantInitiatedSeries}
          resolvedSeries={tenantResolvedSeries}
        />
        <DonutPanel title="Mensajes por bot" />
      </section>

      <section className="tables-grid">
        <TenantUsersTable title="Usuarios de mi empresa" rows={tenantUsers} />
        <BotListPanel title="Bots más activos de mi empresa" rows={tenantTopBots} maxValue={220} />
      </section>
    </DashboardLayout>
  );
}