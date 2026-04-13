import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";


import { AuthProvider } from "./context/AuthProvider";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import SelectTenantPage from "./pages/auth/SelectTenantPage";


function DashboardPage() {
  return <div>Dashboard</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/select-tenant" element={<SelectTenantPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}