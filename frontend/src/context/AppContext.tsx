import { createContext, useMemo, useState } from 'react';
import {
  AppUser,
  AppView,
  FlowNode,
  LogItem,
  Plan,
  Tenant,
  TrainingSample,
  UserRole,
} from '../types';
import {
  initialCompanies,
  initialFlowNodes,
  initialLogs,
  initialTrainingSamples,
  initialUsers,
} from '../services/mockData';

type AppContextValue = {
  tenant: Tenant | null;
  activeView: AppView;
  companies: Tenant[];
  users: AppUser[];
  flowName: string;
  flowNodes: FlowNode[];
  samples: TrainingSample[];
  logs: LogItem[];
  currentTenantUsers: AppUser[];
  setTenantById: (tenantId: string) => void;
  logout: () => void;
  setActiveView: (view: AppView) => void;
  createCompany: (payload: { name: string; slug: string; plan: Plan }) => void;
  toggleCompanyStatus: (companyId: string) => void;
  inviteUser: (payload: { fullName: string; email: string; role: UserRole }) => void;
  setFlowName: (name: string) => void;
  addFlowNode: () => void;
  addTrainingSample: (payload: { intent: string; phrase: string }) => void;
  runTraining: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

const createId = () => crypto.randomUUID().slice(0, 8);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [companies, setCompanies] = useState<Tenant[]>(initialCompanies);
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [flowName, setFlowName] = useState('Onboarding cliente web');
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>(initialFlowNodes);
  const [samples, setSamples] = useState<TrainingSample[]>(initialTrainingSamples);
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);

  const appendLog = (entry: Omit<LogItem, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      {
        id: createId(),
        timestamp: `${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC`,
        ...entry,
      },
      ...prev,
    ]);
  };

  const setTenantById = (tenantId: string) => {
    const selected = companies.find((company) => company.id === tenantId) ?? null;
    setTenant(selected);
    setActiveView('dashboard');
    if (selected) {
      appendLog({ level: 'INFO', area: 'Auth', message: `Login en tenant ${selected.slug}` });
    }
  };

  const logout = () => {
    if (tenant) {
      appendLog({ level: 'INFO', area: 'Auth', message: `Logout de tenant ${tenant.slug}` });
    }
    setTenant(null);
  };

  const createCompany = ({ name, slug, plan }: { name: string; slug: string; plan: Plan }) => {
    const company: Tenant = {
      id: `t-${createId()}`,
      name,
      slug,
      plan,
      activeUsers: 0,
      status: 'active',
    };
    setCompanies((prev) => [...prev, company]);
    appendLog({ level: 'INFO', area: 'Tenants', message: `Empresa creada: ${name}` });
  };

  const toggleCompanyStatus = (companyId: string) => {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === companyId
          ? { ...company, status: company.status === 'active' ? 'paused' : 'active' }
          : company,
      ),
    );
  };

  const inviteUser = ({ fullName, email, role }: { fullName: string; email: string; role: UserRole }) => {
    if (!tenant) return;

    setUsers((prev) => [
      ...prev,
      {
        id: `u-${createId()}`,
        fullName,
        email,
        role,
        tenantId: tenant.id,
        status: 'invited',
      },
    ]);
    appendLog({ level: 'INFO', area: 'Users', message: `Invitación enviada a ${email}` });
  };

  const addFlowNode = () => {
    setFlowNodes((prev) => [
      ...prev,
      {
        id: `n-${createId()}`,
        label: `Nuevo nodo ${prev.length + 1}`,
        type: 'message',
        next: [],
      },
    ]);
  };

  const addTrainingSample = ({ intent, phrase }: { intent: string; phrase: string }) => {
    setSamples((prev) => [...prev, { id: `s-${createId()}`, intent, phrase }]);
    appendLog({ level: 'INFO', area: 'NLU', message: `Nueva muestra para intent ${intent}` });
  };

  const runTraining = () => {
    appendLog({ level: 'INFO', area: 'NLU', message: `Entrenamiento lanzado con ${samples.length} muestras` });
  };

  const currentTenantUsers = useMemo(
    () => users.filter((user) => !tenant || user.tenantId === tenant.id),
    [tenant, users],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      tenant,
      activeView,
      companies,
      users,
      flowName,
      flowNodes,
      samples,
      logs,
      currentTenantUsers,
      setTenantById,
      logout,
      setActiveView,
      createCompany,
      toggleCompanyStatus,
      inviteUser,
      setFlowName,
      addFlowNode,
      addTrainingSample,
      runTraining,
    }),
    [tenant, activeView, companies, users, flowName, flowNodes, samples, logs, currentTenantUsers],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
