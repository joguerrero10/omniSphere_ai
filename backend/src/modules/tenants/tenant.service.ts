import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  async create(dto: CreateTenantDto, userId: string) {
    const data: Prisma.TenantCreateInput = {
      name: dto.name,
      plan: dto.plan,
      createdBy: userId,
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as Prisma.InputJsonValue }
        : {}),
    };

    const tenant = await this.prisma.tenant.create({
      data,
    });

    await this.audit.log(`Tenant created: ${tenant.name}`, tenant.id, userId);

    return tenant;
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTenantId(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, userId: string) {
    await this.findByTenantId(id);

    const data: Prisma.TenantUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.plan !== undefined ? { plan: dto.plan } : {}),
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as Prisma.InputJsonValue }
        : {}),
    };

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
    });

    await this.audit.log(`Tenant updated: ${tenant.name}`, tenant.id, userId);

    return tenant;
  }

  async remove(id: string, userId: string) {
    await this.findByTenantId(id);

    const tenant = await this.prisma.tenant.delete({
      where: { id },
    });

    await this.audit.log(`Tenant deleted: ${tenant.name}`, id, userId);

    return tenant;
  }

}