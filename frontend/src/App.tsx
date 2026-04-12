import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './hooks/useAppContext';
import { renderView } from './store/viewRegistry';

function AppShell() {
  const { tenant, activeView } = useAppContext();

  if (!tenant) {
    return <LoginScreen />;
  }

  return (
    <main className="page">
      <Sidebar />
      <section className="content">{renderView(activeView)}</section>
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
