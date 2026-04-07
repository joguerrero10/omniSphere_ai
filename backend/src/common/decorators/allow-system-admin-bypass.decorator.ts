import { SetMetadata } from '@nestjs/common';

export const ALLOW_SYSTEM_ADMIN_BYPASS_KEY = 'allow_system_admin_bypass';

export const AllowSystemAdminBypass = () =>
  SetMetadata(ALLOW_SYSTEM_ADMIN_BYPASS_KEY, true);