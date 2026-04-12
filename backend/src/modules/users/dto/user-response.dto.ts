import { RoleName } from "../../../common/constant/roles.constants";

export class UserResponseDto {
  id!: string;
  email!: string;
  name?: string | null;
  tenantId!: string;
  isActive!: boolean;
  lastLoginAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  roles!: RoleName[];
}
