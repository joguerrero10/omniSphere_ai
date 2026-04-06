import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const user = req.user as
      | {
        userId?: string;
        tenantId?: string;
      }
      | undefined;

    if (user?.userId && user?.tenantId) {
      return `user:${user.userId}:tenant:${user.tenantId}`;
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.ip;

    return `ip:${ip}`;
  }
}