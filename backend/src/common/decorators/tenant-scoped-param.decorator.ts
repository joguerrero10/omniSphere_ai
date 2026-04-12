import { SetMetadata } from "@nestjs/common";

export const TENANT_SCOPED_PARAM_KEY = "tenant_scoped_param";

export const TenantScopedParam = (paramName: string) =>
  SetMetadata(TENANT_SCOPED_PARAM_KEY, paramName);
