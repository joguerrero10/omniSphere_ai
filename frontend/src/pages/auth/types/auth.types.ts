export type AppRole = "ADMIN_SISTEMA" | "ADMIN_TENANT" | "USER";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: AppRole[];
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

export type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: (reason?: "manual" | "expired") => void;
  hasRole: (...roles: string[]) => boolean;
};