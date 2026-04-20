import { Link } from "react-router-dom";
import "./dashboard.css";
import { useNavigate } from "react-router-dom";

const kpiCards = [
  { label: "Empresas", value: "12", delta: "+ 2 este mes", tone: "positive" },
  { label: "Bots activos", value: "31", delta: "+ 5 nuevos", tone: "positive" },
  { label: "Conversaciones", value: "8,472", delta: "+ 12% semana", tone: "positive" },
  { label: "Mensajes hoy", value: "2,104", delta: "+ 8% vs ayer", tone: "positive" },
  { label: "Usuarios activos", value: "1,839", delta: "+ 3% semana", tone: "positive" },
  { label: "Tasa resolución", value: "87%", delta: "▼ 1% semana", tone: "negative" },
] as const;

const companies = [
  ["TechCorp S.A.", "6", "2,140", "Activa"],
  ["RetailMax", "5", "1,890", "Activa"],
  ["FinancePro", "4", "1,452", "Activa"],
  ["SaludPlus", "4", "1,104", "Pausada"],
  ["LogiTrack", "3", "876", "Activa"],
  ["EduSmart", "3", "612", "Trial"],
  ["InmoGroup", "2", "398", "Inactiva"],
] as const;

const topBots = [
  { name: "Soporte General", company: "TechCorp", value: 312, color: "#8f3dff" },
  { name: "Ventas Bot", company: "RetailMax", value: 265, color: "#10b981" },
  { name: "Consultas Financ.", company: "FinancePro", value: 218, color: "#ef4444" },
  { name: "Citas Médicas", company: "SaludPlus", value: 174, color: "#3b82f6" },
  { name: "Tracking Envíos", company: "LogiTrack", value: 130, color: "#65a30d" },
  { name: "Tutor IA", company: "EduSmart", value: 88, color: "#f59e0b" },
] as const;

const dayLabels = ["03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"];
const initiatedSeries = [390, 350, 470, 460, 520, 560, 540, 590, 680, 640, 700, 440, 360, 550];
const resolvedSeries = [360, 330, 440, 430, 500, 540, 520, 570, 650, 620, 670, 420, 340, 510];

const chartWidth = 640;
const chartHeight = 260;
const minY = 300;
const maxY = 720;

const yToPixel = (value: number) => ((maxY - value) / (maxY - minY)) * chartHeight;

const buildLinePath = (series: readonly number[]) =>
  series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * chartWidth;
      const y = yToPixel(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

const kpiCards = [
  { label: "Empresas", value: "12", delta: "+ 2 este mes", tone: "positive" },
  { label: "Bots activos", value: "31", delta: "+ 5 nuevos", tone: "positive" },
  { label: "Conversaciones", value: "8,472", delta: "+ 12% semana", tone: "positive" },
  { label: "Mensajes hoy", value: "2,104", delta: "+ 8% vs ayer", tone: "positive" },
  { label: "Usuarios activos", value: "1,839", delta: "+ 3% semana", tone: "positive" },
  { label: "Tasa resolución", value: "87%", delta: "▼ 1% semana", tone: "negative" },
] as const;

const companies = [
  ["TechCorp S.A.", "6", "2,140", "Activa"],
  ["RetailMax", "5", "1,890", "Activa"],
  ["FinancePro", "4", "1,452", "Activa"],
  ["SaludPlus", "4", "1,104", "Pausada"],
  ["LogiTrack", "3", "876", "Activa"],
  ["EduSmart", "3", "612", "Trial"],
  ["InmoGroup", "2", "398", "Inactiva"],
] as const;

const topBots = [
  { name: "Soporte General", company: "TechCorp", value: 312, color: "#8f3dff" },
  { name: "Ventas Bot", company: "RetailMax", value: 265, color: "#10b981" },
  { name: "Consultas Financ.", company: "FinancePro", value: 218, color: "#ef4444" },
  { name: "Citas Médicas", company: "SaludPlus", value: 174, color: "#3b82f6" },
  { name: "Tracking Envíos", company: "LogiTrack", value: 130, color: "#65a30d" },
  { name: "Tutor IA", company: "EduSmart", value: 88, color: "#f59e0b" },
] as const;

const dayLabels = ["03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"];
const initiatedSeries = [390, 350, 470, 460, 520, 560, 540, 590, 680, 640, 700, 440, 360, 550];
const resolvedSeries = [360, 330, 440, 430, 500, 540, 520, 570, 650, 620, 670, 420, 340, 510];

const chartWidth = 640;
const chartHeight = 260;
const minY = 300;
const maxY = 720;

const yToPixel = (value: number) => ((maxY - value) / (maxY - minY)) * chartHeight;

const buildLinePath = (series: readonly number[]) =>
  series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * chartWidth;
      const y = yToPixel(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <main className="overview-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">O</span>
          <div>
            <h1>OmniSphere</h1>
            <p>AI Platform</p>
          </div>
        </div>

        <nav>
          <p className="menu-label">GENERAL</p>
          <Link className="menu-item active" to="/dashboard">Overview</Link>
          <Link className="menu-item" to="/empresas">Empresas ↗</Link>
          <button className="menu-item" type="button">Bots ↗</button>
          <button className="menu-item" type="button">Actividad</button>
          <button className="menu-item" type="button">Conversaciones ↗</button>
          <button className="menu-item" type="button">Mensajes ↗</button>
          <button className="menu-item" type="button">Usuarios ↗</button>

          <p className="menu-label">SISTEMA</p>
          <button className="menu-item" type="button">Config ↗</button>
          <button className="menu-item" type="button">API Keys ↗</button>
        </nav>
      </aside>

      <section className="overview-content">
        <header className="overview-header">
          <div>
            <h2>Overview general</h2>
            <p>Actividad de la plataforma · Última actualización: hoy, 10:42 AM</p>
          </div>
          <button className="menu-button" type="button" aria-label="Abrir menú de opciones">
            ...
          </button>
        </header>

        <section className="kpi-grid">
          {kpiCards.map((card) => (
            <article key={card.label} className="kpi-card">
              <p>{card.label}</p>
              <h3>{card.value}</h3>
              <span className={card.tone}>{card.delta}</span>
            </article>
          ))}
        </section>

        <section className="charts-grid">
          <article className="panel chart-panel">
            <div className="panel-header">
              <h3>Conversaciones por día</h3>
              <small>últimos 14 días</small>
            </div>

            <div className="legend">
              <span>
                <i className="dot initiated" /> Iniciadas
              </span>
              <span>
                <i className="dot resolved" /> Resueltas
              </span>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="line-chart" role="img" aria-label="Conversaciones iniciadas y resueltas">
              {[300, 400, 500, 600, 700].map((tick) => {
                const y = yToPixel(tick);
                return (
                  <g key={tick}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} className="chart-grid" />
                    <text x="4" y={y - 6} className="chart-y-label">
                      {tick}
                    </text>
                  </g>
                );
              })}

              {dayLabels.map((day, index) => {
                const x = (index / (dayLabels.length - 1)) * chartWidth;
                return (
                  <g key={day}>
                    <line x1={x} y1="0" x2={x} y2={chartHeight} className="chart-grid subtle" />
                    <text x={x} y={chartHeight - 8} className="chart-x-label">
                      {day}
                    </text>
                  </g>
                );
              })}

              <path d={buildLinePath(initiatedSeries)} className="series initiated" />
              <path d={buildLinePath(resolvedSeries)} className="series resolved" />
            </svg>
          </article>

          <article className="panel donut-panel">
            <h3>Mensajes por empresa</h3>
            <div className="donut" aria-hidden="true" />
          </article>
        </section>

        <section className="tables-grid">
          <article className="panel">
            <h3>Empresas registradas</h3>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Bots</th>
                  <th>Conv.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(([name, bots, conv, status]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{bots}</td>
                    <td>{conv}</td>
                    <td>
                      <span className={`status ${status.toLowerCase()}`}>{status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="panel">
            <h3>Bots más activos hoy</h3>
            <ul className="bot-list">
              {topBots.map((bot) => (
                <li key={bot.name}>
                  <div>
                    <strong>{bot.name}</strong>
                    <small>{bot.company}</small>
                  </div>
                  <div className="meter">
                    <span style={{ width: `${(bot.value / 320) * 100}%`, background: bot.color }} />
                  </div>
                  <em>{bot.value}</em>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}
