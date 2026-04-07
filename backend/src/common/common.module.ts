import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RolesGuard } from './guards/roles.guard';
import { TenantResourceGuard } from './guards/tenant-resource.guard';

@Module({
  providers: [PrismaService, RolesGuard, TenantResourceGuard],
  exports: [PrismaService, RolesGuard, TenantResourceGuard],
})
export class CommonModule { }