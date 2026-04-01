import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) { }

  async create(dto: CreateTenantDto, userId: string) {
    const tenant = await this.prisma.tenant.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });

    await this.audit.log(`Tenant created: ${tenant.name}`, tenant.id, userId);

    return tenant;
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, userId: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });

    await this.audit.log(`Tenant updated: ${tenant.name}`, id, userId);

    return tenant;
  }

  async remove(id: string, userId: string) {
    const tenant = await this.prisma.tenant.delete({
      where: { id },
    });

    await this.audit.log(`Tenant deleted: ${tenant.name}`, id, userId);

    return tenant;
  }
}