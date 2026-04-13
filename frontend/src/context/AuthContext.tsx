import { createContext } from "react";
import type { AuthUser, LoginRequest, Tenant } from "../types/auth.types";

export interface AuthContextType {
  user: AuthUser | null;
  tenants: Tenant[];
  activeTenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
  setActiveTenantById: (tenantId: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);