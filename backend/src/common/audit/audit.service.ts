import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) { }

  async log(action: string, tenantId: string, userId?: string) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          tenantId,
          userId,
        },
      });
    } catch (error) {
      this.logger.error(
        'Audit error',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}