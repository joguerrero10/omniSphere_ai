import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthProvider";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import SelectTenantPage from "./pages/auth/SelectTenantPage";
import CompaniesPage from "./pages/companies/CompaniesPage";
import CompanyDetailPage from "./pages/companies/CompanyDetailPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import CompaniesPage from "./pages/companies/CompaniesPage";
import CompanyDetailPage from "./pages/companies/CompanyDetailPage";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          <Route
            path="/empresas"
            element={
              <ProtectedRoute>
                <CompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id"
            element={
              <ProtectedRoute>
                <CompanyDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
