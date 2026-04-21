import { useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";

import SystemAdminDashboard from "./SystemAdminDashboard";
import TenantAdminDashboard from "./TenantAdminDashboard";
import UserDashboard from "./UserDashboard";


export default function DashboardPage() {
  const { user } = useAuth();

  const isSystemAdmin = useMemo(
    () => !!user?.roles?.includes("ADMIN_SISTEMA"),
    [user?.roles],
  );

  const isTenantAdmin = useMemo(
    () =>
      !!user?.roles?.includes("ADMIN_TENANT") &&
      !user?.roles?.includes("ADMIN_SISTEMA"),
    [user?.roles],
  );

  if (isSystemAdmin) {
    return <SystemAdminDashboard />;
  }

  if (isTenantAdmin) {
    return <TenantAdminDashboard />;
  }

  return <UserDashboard />;
}