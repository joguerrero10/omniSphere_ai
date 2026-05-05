import { useCallback, useEffect, useState, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { AuthUser, LoginRequest, Tenant } from "../types/auth.types";
import { AuthContext } from "./AuthContext";

const ACCESS_TOKEN_KEY = "accessToken";
const TENANTS_KEY = "tenants";
const USER_KEY = "authUser";
const TENANT_ID_KEY = "tenantId";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  });

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem(TENANTS_KEY);
    return saved ? (JSON.parse(saved) as Tenant[]) : [];
  });

  const [activeTenant, setActiveTenant] = useState<Tenant | null>(() => {
    const savedTenants = localStorage.getItem(TENANTS_KEY);
    const savedTenantId = localStorage.getItem(TENANT_ID_KEY);

    if (!savedTenants || !savedTenantId) return null;

    const parsed: Tenant[] = JSON.parse(savedTenants);
    return parsed.find((t) => t.id === savedTenantId) ?? null;
  });

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setTenants([]);
    setActiveTenant(null);

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANTS_KEY);
    localStorage.removeItem(TENANT_ID_KEY);
  }, []);

  // Auto-logout when JWT expires
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (typeof payload.exp !== 'number') return;
      const msUntilExpiry = payload.exp * 1000 - Date.now();
      if (msUntilExpiry <= 0) { logout(); return; }
      const timer = setTimeout(logout, msUntilExpiry);
      return () => clearTimeout(timer);
    } catch { /* non-standard token */ }
  }, [token, logout]);

  const login = async (payload: LoginRequest): Promise<{ needsTenantSelection: boolean }> => {
    const response = await authService.login(payload);

    if (!response?.access_token || !response?.user) {
      throw new Error("Respuesta de login inválida");
    }

    const derivedTenants: Tenant[] = response.user.tenantId
      ? [{ id: response.user.tenantId, name: "Tenant principal" }]
      : [];

    const defaultTenantId = response.user.tenantId ?? null;

    setToken(response.access_token);
    setUser(response.user);
    setTenants(derivedTenants);

    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(TENANTS_KEY, JSON.stringify(derivedTenants));

    let tenantToActivate: Tenant | null = null;

    if (defaultTenantId) {
      tenantToActivate = derivedTenants.find((t) => t.id === defaultTenantId) ?? null;
    } else if (derivedTenants.length === 1) {
      tenantToActivate = derivedTenants[0];
    }

    if (tenantToActivate) {
      setActiveTenant(tenantToActivate);
      localStorage.setItem(TENANT_ID_KEY, tenantToActivate.id);
    } else {
      setActiveTenant(null);
      localStorage.removeItem(TENANT_ID_KEY);
    }

    return { needsTenantSelection: derivedTenants.length > 1 && !tenantToActivate };
  };

  const setActiveTenantById = (tenantId: string) => {
    const found = tenants.find((t) => t.id === tenantId) ?? null;
    setActiveTenant(found);

    if (found) {
      localStorage.setItem(TENANT_ID_KEY, found.id);
    } else {
      localStorage.removeItem(TENANT_ID_KEY);
    }
  };

  const loading = false;

  return (
    <AuthContext.Provider
      value={{
        user,
        tenants,
        activeTenant,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        setActiveTenantById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}