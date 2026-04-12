import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    correlationId?: string;
    user?: {
      userId?: string;
      tenantId?: string;
      email?: string;
      roles?: string[];
    };
  }
}