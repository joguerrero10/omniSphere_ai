import { AppProvider } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { useAppContext } from './hooks/useAppContext';
import { AiTrainingPage } from './pages/AiTrainingPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { DashboardPage } from './pages/DashboardPage';
import { FlowsPage } from './pages/FlowsPage';
import { LogsPage } from './pages/LogsPage';
import { UsersPage } from './pages/UsersPage';

function AppShell() {
  const { tenant, activeView } = useAppContext();

  if (!tenant) {
    return <LoginScreen />;
  }

  return (
    <main className="page">
      <Sidebar />
      <section className="content">
        {activeView === 'dashboard' && <DashboardPage />}
        {activeView === 'empresas' && <CompaniesPage />}
        {activeView === 'usuarios' && <UsersPage />}
        {activeView === 'flujos' && <FlowsPage />}
        {activeView === 'ia' && <AiTrainingPage />}
        {activeView === 'logs' && <LogsPage />}
      </section>
    </main>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
