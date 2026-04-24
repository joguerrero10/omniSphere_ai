import 'express-serve-static-core';

declare global {
  namespace Express {
    interface User {
      userId: string;
      tenantId: string;
      email?: string;
      roles: string[];
      companyId?: string;
      isActive?: boolean;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    correlationId?: string;
  }
}

export { };
