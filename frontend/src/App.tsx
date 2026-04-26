import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { lazy } from 'react';
import { AuthProvider } from "./context/AuthProvider";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import RoleRoute from "./pages/auth/RoleRoute";
import SelectTenantPage from "./pages/auth/SelectTenantPage";
import UnauthorizedPage from "./pages/auth/UnauthorizedPage";
import CompaniesPage from "./pages/companies/CompaniesPage";
import CompanyDetailPage from "./pages/companies/CompanyDetailPage";
import DashboardPage from "./pages/dashboard/DashboardPage";

const BotsPage = lazy(() => import('./pages/bots/BotsPage'));


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/select-tenant"
            element={
              <ProtectedRoute requireTenant={false}>
                <SelectTenantPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route element={<RoleRoute allowedRoles={["ADMIN_SISTEMA", "ADMIN_TENANT"]} />}>
            <Route path="/company" element={<CompaniesPage />} />
          </Route>
          <Route
            path="/company/:id"
            element={
              <ProtectedRoute>
                <CompanyDetailPage />
              </ProtectedRoute>
            }
          />
          <Route element={<RoleRoute allowedRoles={["ADMIN_SISTEMA"]} />}>
            <Route path="/config" element={<div>Config</div>} />
            <Route path="/api-keys" element={<div>API Keys</div>} />
          </Route>
          <Route path="/bots" element={<BotsPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
