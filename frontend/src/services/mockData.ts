import { AppUser, FlowNode, LogItem, Tenant, TrainingSample } from '../types';

export const initialCompanies: Tenant[] = [
  { id: 't-acme', name: 'Acme Retail', slug: 'acme', plan: 'Growth', activeUsers: 14, status: 'active' },
  { id: 't-orbit', name: 'Orbit Logistics', slug: 'orbit', plan: 'Starter', activeUsers: 5, status: 'active' },
];

export const initialUsers: AppUser[] = [
  { id: 'u1', fullName: 'Laura Torres', email: 'laura@acme.ai', role: 'Owner', tenantId: 't-acme', status: 'active' },
  { id: 'u2', fullName: 'Diego Ruiz', email: 'diego@acme.ai', role: 'Analyst', tenantId: 't-acme', status: 'active' },
  { id: 'u3', fullName: 'Paz Moreno', email: 'paz@orbit.ai', role: 'Admin', tenantId: 't-orbit', status: 'invited' },
];

export const initialFlowNodes: FlowNode[] = [
  { id: 'n1', label: 'Webhook recibido', type: 'trigger', next: ['n2'] },
  { id: 'n2', label: 'Mensaje bienvenida', type: 'message', next: ['n3'] },
  { id: 'n3', label: '¿Tiene cuenta?', type: 'condition', next: ['n4'] },
  { id: 'n4', label: 'Asignar agente', type: 'action', next: [] },
];

export const initialTrainingSamples: TrainingSample[] = [
  { id: 's1', intent: 'saludo', phrase: 'hola, necesito ayuda con mi pedido' },
  { id: 's2', intent: 'estado_pedido', phrase: '¿dónde está mi compra?' },
];

export const initialLogs: LogItem[] = [
  { id: 'l1', level: 'INFO', area: 'Auth', message: 'Login exitoso en tenant acme', timestamp: '2026-04-12 09:30 UTC' },
  { id: 'l2', level: 'WARN', area: 'Flows', message: 'Nodo sin salida detectado en flujo de soporte', timestamp: '2026-04-12 09:51 UTC' },
];
