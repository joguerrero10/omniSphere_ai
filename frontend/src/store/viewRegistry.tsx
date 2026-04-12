import { AppView } from '../types';
import { AiTrainingPage } from '../pages/AiTrainingPage';
import { CompaniesPage } from '../pages/CompaniesPage';
import { DashboardPage } from '../pages/DashboardPage';
import { FlowsPage } from '../pages/FlowsPage';
import { LogsPage } from '../pages/LogsPage';
import { UsersPage } from '../pages/UsersPage';

export function renderView(view: AppView) {
  switch (view) {
    case 'dashboard':
      return <DashboardPage />;
    case 'empresas':
      return <CompaniesPage />;
    case 'usuarios':
      return <UsersPage />;
    case 'flujos':
      return <FlowsPage />;
    case 'ia':
      return <AiTrainingPage />;
    case 'logs':
      return <LogsPage />;
    default:
      return <DashboardPage />;
  }
}
