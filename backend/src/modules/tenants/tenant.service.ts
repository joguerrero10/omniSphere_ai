import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../../common/audit/audit.service";
import { ROLES } from "../../common/constant/roles.constants";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { PrismaService } from "../../database/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  async create(dto: CreateTenantDto, user: CurrentUserPayload) {
    const data: Prisma.TenantCreateInput = {
      name: dto.name.trim(),
      plan: dto.plan,
      createdById: user.userId,
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as Prisma.InputJsonValue }
        : {}),
    };

    const tenant = await this.prisma.tenant.create({
      data,
    });

    await this.audit.log(`Tenant created: ${tenant.name}`, tenant.id, user.email ?? user.userId);

    return tenant;
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findVisibleForUser(user: CurrentUserPayload) {
    if (this.isSystemAdmin(user.roles)) {
      return this.findAll();
    }

    return this.prisma.tenant.findMany({
      where: { createdById: user.userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByTenantId(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, user: CurrentUserPayload) {
    await this.assertTenantManagementAccess(id, user);

    const data: Prisma.TenantUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.plan !== undefined ? { plan: dto.plan } : {}),
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as Prisma.InputJsonValue }
        : {}),
    };

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
    });

    await this.audit.log(`Tenant updated: ${tenant.name}`, tenant.id, user.userId);

    return tenant;
  }

  async remove(id: string, user: CurrentUserPayload) {
    await this.assertTenantManagementAccess(id, user);

    const tenant = await this.prisma.tenant.delete({
      where: { id },
    });

    await this.audit.log(`Tenant deleted: ${tenant.name}`, id, user.userId);

    return tenant;
  }

  async findOneVisibleForUser(id: string, user: CurrentUserPayload) {
    const tenant = await this.findByTenantId(id);

    if (this.isSystemAdmin(user.roles) || user.tenantId === tenant.id) {
      return tenant;
    }

    throw new ForbiddenException("No tienes acceso a esta empresa.");
  }

  private async assertTenantManagementAccess(id: string, user: CurrentUserPayload) {
    const tenant = await this.findByTenantId(id);

    if (this.isSystemAdmin(user.roles) || user.tenantId === tenant.id) {
      return tenant;
    }
    throw new ForbiddenException("Puedes actualizar únicamente la empresa asociada a tu cuenta.");
  }

  private isSystemAdmin(roles: string[]) {
    return Array.isArray(roles) && roles.includes(ROLES.ADMIN_SISTEMA);
  }
}
