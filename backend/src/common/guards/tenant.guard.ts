import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../database/prisma.service";

import { ROLES } from "../constant/roles.constants";
import { ALLOW_SYSTEM_ADMIN_BYPASS_KEY } from "../decorators/allow-system-admin-bypass.decorator";
import { TENANT_SCOPED_PARAM_KEY } from "../decorators/tenant-scoped-param.decorator";
import { CurrentUserPayload } from "../interfaces/current-user.interface";

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload | undefined;

    if (!user) {
      throw new ForbiddenException("Authenticated user not found");
    }

    const allowSystemAdminBypass =
      this.reflector.getAllAndOverride<boolean>(ALLOW_SYSTEM_ADMIN_BYPASS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (
      allowSystemAdminBypass &&
      Array.isArray(user.roles) &&
      user.roles.includes(ROLES.ADMIN_SISTEMA)
    ) {
      return true;
    }

    const paramName = this.reflector.getAllAndOverride<string>(
      TENANT_SCOPED_PARAM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!paramName) {
      return true;
    }

    const resourceId = request.params?.[paramName];
    if (!resourceId) {
      throw new ForbiddenException(
        `Route parameter "${paramName}" was not provided`,
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: resourceId },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    if (tenant.id !== user.tenantId) {
      throw new ForbiddenException(
        "You do not have access to this tenant resource",
      );
    }

    return true;
  }
}
