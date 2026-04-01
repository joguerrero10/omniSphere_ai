import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
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
      console.error('Audit error:', err);
    }
  }
}