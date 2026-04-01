import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';

const tenantRateMap = new Map<string, { count: number; lastReset: number }>();
const MAX_REQUESTS_PER_MIN = 60;

@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user?.tenantId) return true;

    const now = Date.now();

    const data = tenantRateMap.get(user.tenantId) ?? {
      count: 0,
      lastReset: now,
    };

    if (now - data.lastReset > 60_000) {
      data.count = 0;
      data.lastReset = now;
    }

    data.count++;
    tenantRateMap.set(user.tenantId, data);

    if (data.count > MAX_REQUESTS_PER_MIN) {
      throw new TooManyRequestsException(
        'Rate limit exceeded for this tenant',
      );
    }

    return true;
  }
}