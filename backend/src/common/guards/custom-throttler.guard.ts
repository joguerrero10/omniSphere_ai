import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Request, Response } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    protected readonly options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Define el identificador único del cliente para rate limiting.
   * Prioriza usuario autenticado + tenant.
   * Si no existe, cae a IP.
   */
  protected async getTracker(req: Request): Promise<string> {
    const user = req.user;

    if (user?.userId && user?.tenantId) {
      return `user:${user.userId}:tenant:${user.tenantId}`;
    }

    const forwardedFor = req.headers['x-forwarded-for'];

    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : req.ip || req.socket.remoteAddress || 'unknown';

    return `ip:${ip}`;
  }

  /**
   * Debe ser síncrono.
   */
  protected getRequestResponse(
    context: ExecutionContext,
  ): { req: Request; res: Response } {
    const http = context.switchToHttp();

    return {
      req: http.getRequest<Request>(),
      res: http.getResponse<Response>(),
    };
  }
}