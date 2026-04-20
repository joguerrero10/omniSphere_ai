import LeadsChart from "../../components/dashboard/LeadsChart";
import "./dashboard.css";

export default function DashboardPage() {
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <h1>Dashboard de Operaciones</h1>
        <p>Monitorea el rendimiento diario de tickets iniciados y resueltos.</p>
      </header>

      <LeadsChart />
    </main>
  );
}
