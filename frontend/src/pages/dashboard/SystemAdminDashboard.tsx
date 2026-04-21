import DashboardLayout from "./DashboardLayout";
import BotListPanel from "./components/BotListPanel";
import CompaniesTable from "./components/CompaniesTable";
import DonutPanel from "./components/DonutPanel";
import KpiGrid from "./components/KpiGrid";
import LineChartPanel from "./components/LineChartPanel";

import "./dashboard.css";
import {
  dayLabels,
  systemCompanies,
  systemInitiatedSeries,
  systemKpis,
  systemResolvedSeries,
  systemTopBots,
} from "./dashboard.data";

export default function SystemAdminDashboard() {
  return (
    <DashboardLayout
      role="system"
      title="Overview general"
      description="Actividad de la plataforma · Última actualización: hoy, 10:42 AM"
    >
      <KpiGrid items={systemKpis} />

      <section className="charts-grid">
        <LineChartPanel
          title="Conversaciones por día"
          subtitle="últimos 14 días"
          labels={dayLabels}
          initiatedSeries={systemInitiatedSeries}
          resolvedSeries={systemResolvedSeries}
        />
        <DonutPanel title="Mensajes por empresa" />
      </section>

      <section className="tables-grid">
        <CompaniesTable title="Empresas registradas" rows={systemCompanies} />
        <BotListPanel title="Bots más activos hoy" rows={systemTopBots} />
      </section>
    </DashboardLayout>
  );
}