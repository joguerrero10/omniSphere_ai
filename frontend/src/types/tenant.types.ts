export type TenantPlan = "BASIC" | "PRO" | "ENTERPRISE";

export interface TenantRecord {
  id: string;
  name: string;
  plan: TenantPlan;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenantRequest {
  name: string;
  plan: TenantPlan;
  metadata?: Record<string, unknown>;
}

export interface UpdateTenantRequest {
  name?: string;
  plan?: TenantPlan;
  metadata?: Record<string, unknown>;
}
