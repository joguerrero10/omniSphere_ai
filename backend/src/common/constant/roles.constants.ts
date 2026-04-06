export const ROLES = {
  ADMIN_SISTEMA: 'ADMIN_SISTEMA',
  ADMIN_TENANT: 'ADMIN_TENANT',
  USER: 'USER',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];