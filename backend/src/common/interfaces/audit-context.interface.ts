export interface AuditContext {
  ip?: string;
  userAgent?: string;
  targetUserId?: string;
  [key: string]: unknown;
}
