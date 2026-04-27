import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { SessionGuard } from "./components/auth/SessionGuard";
import { AuthProvider } from "./context/AuthProvider";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import RoleRoute from "./pages/auth/RoleRoute";
import SelectTenantPage from "./pages/auth/SelectTenantPage";
import CompaniesPage from "./pages/companies/CompaniesPage";
import CompanyDetailPage from "./pages/companies/CompanyDetailPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ForbiddenPage from './pages/errors/ForbiddenPage';
import NotFoundPage from "./pages/errors/NotFoundPage";
import { ServerErrorPage } from "./pages/errors/ServerErrorPage";
import UnauthorizedPage from "./pages/errors/UnauthorizedPage";

const BotsPage = lazy(() => import('./pages/bots/BotsPage'));

// Layout que aplica SessionGuard a todas las rutas protegidas
function ProtectedLayout() {
  return (
    <SessionGuard>
      <Outlet />
    </SessionGuard>
  );
}

// Fallback mientras carga un componente lazy
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a12',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 28,
        height: 28,
        border: '2px solid rgba(255,255,255,0.08)',
        borderTopColor: '#6c5ce7',
        borderRadius: '50%',
        animation: 'spin 0.65s linear infinite',
      }} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Rutas públicas ───────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/401" element={<UnauthorizedPage />} />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/500" element={<ServerErrorPage />} />

            {/* ── Rutas protegidas (SessionGuard activo) ───── */}
            <Route element={<ProtectedLayout />}>

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

              <Route
                path="/bots"
                element={
                  <ProtectedRoute>
                    <BotsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 dentro del área protegida */}
              <Route path="*" element={<NotFoundPage />} />

            </Route>

            {/* Redirect raíz al login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}