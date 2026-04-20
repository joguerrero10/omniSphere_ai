import { RoleName } from "../constant/roles.constants";

export interface CurrentUserPayload {
  userId: string;
  email?: string;
  tenantId: string;
  roles: RoleName[];
}
