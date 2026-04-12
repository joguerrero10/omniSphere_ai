import { SetMetadata } from "@nestjs/common";
import { TenantResourceOptions } from "../interfaces/tenant-resource-options.interface";

export const TENANT_RESOURCE_KEY = "tenant_resource";

export const TenantResource = (options: TenantResourceOptions) =>
  SetMetadata(TENANT_RESOURCE_KEY, options);
