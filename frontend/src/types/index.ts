export type Plan = 'Starter' | 'Growth' | 'Enterprise';
export type UserRole = 'Owner' | 'Admin' | 'Analyst' | 'Agent';
export type FlowNodeType = 'trigger' | 'message' | 'condition' | 'action';

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  activeUsers: number;
  status: 'active' | 'paused';
};

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  tenantId: string;
  status: 'active' | 'invited' | 'suspended';
};

export type FlowNode = {
  id: string;
  label: string;
  type: FlowNodeType;
  next: string[];
};

export type TrainingSample = {
  id: string;
  intent: string;
  phrase: string;
};

export type LogItem = {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  area: string;
  message: string;
  timestamp: string;
};

export type AppView =
  | 'dashboard'
  | 'empresas'
  | 'usuarios'
  | 'flujos'
  | 'ia'
  | 'logs';
