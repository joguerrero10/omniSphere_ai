import type { JSX, ReactNode } from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props): JSX.Element {
  const isAuthenticated = true;
  const selectedTenant = true; 

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!selectedTenant) {
    return <Navigate to="/select-tenant" replace />;
  }

  return <>{children}</>;
}