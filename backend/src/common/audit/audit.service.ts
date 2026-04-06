import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) { }

  async log(action: string, tenantId: string, userId?: string) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          tenantId,
          userId,
        },
      });
    } catch (err) {
      this.logger.error('Audit error', err instanceof Error ? err.stack : undefined);
    }
  }
}