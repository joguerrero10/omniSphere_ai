import type { BotRow, CompanyRow, KpiCard, UserActivityRow } from "./dashboard.types";

export const dayLabels = ["03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"];

export const systemInitiatedSeries = [390, 350, 470, 460, 520, 560, 540, 590, 680, 640, 700, 440, 360, 550];
export const systemResolvedSeries = [360, 330, 440, 430, 500, 540, 520, 570, 650, 620, 670, 420, 340, 510];

export const tenantInitiatedSeries = [110, 130, 120, 145, 170, 180, 175, 190, 220, 210, 230, 185, 160, 205];
export const tenantResolvedSeries = [98, 120, 115, 138, 160, 172, 168, 184, 210, 202, 220, 176, 150, 194];

export const userInitiatedSeries = [12, 14, 11, 16, 18, 19, 17, 20, 24, 21, 26, 18, 15, 19];
export const userResolvedSeries = [10, 13, 10, 14, 16, 17, 15, 18, 22, 19, 23, 16, 13, 17];

export const systemKpis: KpiCard[] = [
  { label: "Empresas", value: "12", delta: "+ 2 este mes", tone: "positive" },
  { label: "Bots activos", value: "31", delta: "+ 5 nuevos", tone: "positive" },
  { label: "Conversaciones", value: "8,472", delta: "+ 12% semana", tone: "positive" },
  { label: "Mensajes hoy", value: "2,104", delta: "+ 8% vs ayer", tone: "positive" },
  { label: "Usuarios activos", value: "1,839", delta: "+ 3% semana", tone: "positive" },
  { label: "Tasa resolución", value: "87%", delta: "▼ 1% semana", tone: "negative" },
];

export const tenantKpis: KpiCard[] = [
  { label: "Bots activos", value: "6", delta: "+ 1 esta semana", tone: "positive" },
  { label: "Conversaciones", value: "1,452", delta: "+ 9% semana", tone: "positive" },
  { label: "Mensajes hoy", value: "318", delta: "+ 4% vs ayer", tone: "positive" },
  { label: "Usuarios", value: "24", delta: "+ 2 este mes", tone: "positive" },
  { label: "Tasa resolución", value: "89%", delta: "+ 2% semana", tone: "positive" },
  { label: "Satisfacción", value: "94%", delta: "+ 1% semana", tone: "positive" },
];

export const userKpis: KpiCard[] = [
  { label: "Conversaciones asignadas", value: "18", delta: "+ 3 hoy", tone: "positive" },
  { label: "Mensajes respondidos", value: "74", delta: "+ 12 hoy", tone: "positive" },
  { label: "Pendientes", value: "5", delta: "- 2 vs ayer", tone: "positive" },
  { label: "Tiempo promedio", value: "3.8m", delta: "- 0.4m", tone: "positive" },
  { label: "Resolución", value: "91%", delta: "+ 1% semana", tone: "positive" },
  { label: "SLA", value: "96%", delta: "Sin cambios", tone: "neutral" },
];

export const systemCompanies: CompanyRow[] = [
  { name: "TechCorp S.A.", bots: "6", conversations: "2,140", status: "Activa" },
  { name: "RetailMax", bots: "5", conversations: "1,890", status: "Activa" },
  { name: "FinancePro", bots: "4", conversations: "1,452", status: "Activa" },
  { name: "SaludPlus", bots: "4", conversations: "1,104", status: "Pausada" },
  { name: "LogiTrack", bots: "3", conversations: "876", status: "Activa" },
  { name: "EduSmart", bots: "3", conversations: "612", status: "Trial" },
  { name: "InmoGroup", bots: "2", conversations: "398", status: "Inactiva" },
];

export const tenantUsers = [
  { name: "Ana Pérez", role: "Supervisora", conversations: "214", status: "Activa" },
  { name: "Luis Gómez", role: "Agente", conversations: "183", status: "Activa" },
  { name: "Carla Ríos", role: "Agente", conversations: "167", status: "Activa" },
  { name: "Joel Díaz", role: "Agente", conversations: "122", status: "Pausada" },
];

export const systemTopBots: BotRow[] = [
  { name: "Soporte General", company: "TechCorp", value: 312, color: "#8f3dff" },
  { name: "Ventas Bot", company: "RetailMax", value: 265, color: "#10b981" },
  { name: "Consultas Financ.", company: "FinancePro", value: 218, color: "#ef4444" },
  { name: "Citas Médicas", company: "SaludPlus", value: 174, color: "#3b82f6" },
  { name: "Tracking Envíos", company: "LogiTrack", value: 130, color: "#65a30d" },
  { name: "Tutor IA", company: "EduSmart", value: 88, color: "#f59e0b" },
];

export const tenantTopBots: BotRow[] = [
  { name: "Soporte General", company: "Mi Empresa", value: 198, color: "#8f3dff" },
  { name: "Ventas Bot", company: "Mi Empresa", value: 154, color: "#10b981" },
  { name: "Cobros Bot", company: "Mi Empresa", value: 118, color: "#ef4444" },
  { name: "Postventa", company: "Mi Empresa", value: 96, color: "#3b82f6" },
];

export const userTopBots: BotRow[] = [
  { name: "Soporte General", company: "Mi Área", value: 42, color: "#8f3dff" },
  { name: "Ventas Bot", company: "Mi Área", value: 28, color: "#10b981" },
  { name: "Consultas", company: "Mi Área", value: 19, color: "#ef4444" },
];

export const userActivities: UserActivityRow[] = [
  { title: "Conversación #A-1024", detail: "Cliente consultó sobre estado de pedido", status: "Resuelta", time: "Hace 8 min" },
  { title: "Conversación #A-1021", detail: "Solicitud de cambio de plan", status: "Pendiente", time: "Hace 15 min" },
  { title: "Conversación #A-1018", detail: "Consulta de facturación", status: "Resuelta", time: "Hace 22 min" },
  { title: "Conversación #A-1012", detail: "Error al iniciar sesión", status: "Escalada", time: "Hace 35 min" },
];