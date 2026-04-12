import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const correlationId =
      req.headers['x-correlation-id']?.toString() ?? randomUUID();

    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    return next.handle();
  }
}