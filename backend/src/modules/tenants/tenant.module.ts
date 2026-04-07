import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PrismaService } from '../../database/prisma.service';
import { TenantsController } from './tenant.controller';
import { TenantsService } from './tenant.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, PrismaService, AuditService, TenantGuard],
  exports: [TenantsService],
})
export class TenantsModule { }
