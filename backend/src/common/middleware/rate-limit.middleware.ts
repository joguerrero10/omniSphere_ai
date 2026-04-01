import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';

const rateMap = new Map<
  string,
  { count: number; lastReset: number }
>();

const MAX_REQUESTS_PER_MIN = 100;

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'unknown';

    const tenantId = (req as any).user?.tenantId || 'public';

    const key = `${tenantId}:${ip}`;
    const now = Date.now();

    const data =
      rateMap.get(key) ?? {
        count: 0,
        lastReset: now,
      };

    if (now - data.lastReset > 60000) {
      data.count = 0;
      data.lastReset = now;
    }

    data.count++;
    rateMap.set(key, data);

    if (data.count > MAX_REQUESTS_PER_MIN) {
      throw new TooManyRequestsException(
        `Rate limit exceeded for IP ${ip} in tenant ${tenantId}`,
      );
    }

    next();
  }
}