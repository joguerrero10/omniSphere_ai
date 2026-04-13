export interface Tenant {
  id: string;
  name: string;
  slug?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  tenantId: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}