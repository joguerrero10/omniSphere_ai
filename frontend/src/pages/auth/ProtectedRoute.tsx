import type { JSX, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

type Props = {
  children: ReactNode;
  requireTenant?: boolean;
};

export default function ProtectedRoute({
  children,
  requireTenant = true,
}: Props): JSX.Element {
  const { isAuthenticated, token, activeTenant, tenants, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Cargando sesión...</p>;
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  if (requireTenant && tenants.length > 1 && !activeTenant) {
    return <Navigate to="/select-tenant" replace />;
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
