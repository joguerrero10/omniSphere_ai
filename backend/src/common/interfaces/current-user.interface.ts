import { RoleName } from "../constant/roles.constants";

export interface CurrentUserPayload {
  userId: string;
  tenantId: string;
  roles: RoleName[];
}
