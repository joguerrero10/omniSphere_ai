import DashboardLayout from "./DashboardLayout";
import BotListPanel from "./components/BotListPanel";
import KpiGrid from "./components/KpiGrid";
import LineChartPanel from "./components/LineChartPanel";
import UserActivityPanel from "./components/UserActivityPanel";

import "./dashboard.css";
import {
  dayLabels,
  userActivities,
  userInitiatedSeries,
  userKpis,
  userResolvedSeries,
  userTopBots,
} from "./dashboard.data";

export default function UserDashboard() {
  return (
    <DashboardLayout
      role="user"
      title="Mi panel"
      description="Resumen de tu actividad reciente"
    >
      <KpiGrid items={userKpis} />

      <section className="charts-grid single-chart">
        <LineChartPanel
          title="Mis conversaciones"
          subtitle="últimos 14 días"
          labels={dayLabels}
          initiatedSeries={userInitiatedSeries}
          resolvedSeries={userResolvedSeries}
        />
      </section>

      <section className="tables-grid">
        <UserActivityPanel title="Actividad reciente" rows={userActivities} />
        <BotListPanel title="Bots con más actividad" rows={userTopBots} maxValue={50} />
      </section>
    </DashboardLayout>
  );
}