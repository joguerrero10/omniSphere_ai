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
import { TENANT_RESOURCE_KEY } from "../decorators/tenant-resource.decorator";
import { CurrentUserPayload } from "../interfaces/current-user.interface";
import { TenantResourceOptions } from "../interfaces/tenant-resource-options.interface";

@Injectable()
export class TenantResourceGuard implements CanActivate {
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

    const resourceOptions =
      this.reflector.getAllAndOverride<TenantResourceOptions>(
        TENANT_RESOURCE_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!resourceOptions) {
      return true;
    }

    const {
      model,
      paramName,
      tenantField = "tenantId",
      idField = "id",
      notFoundMessage = "Resource not found",
    } = resourceOptions;

    const resourceId = request.params?.[paramName];

    if (!resourceId) {
      throw new ForbiddenException(
        `Route parameter "${paramName}" was not provided`,
      );
    }

    const modelDelegate = (this.prisma as Record<string, any>)[model];

    if (!modelDelegate || typeof modelDelegate.findFirst !== "function") {
      throw new ForbiddenException(
        `Model "${model}" is not available in PrismaService`,
      );
    }

    const resource = await modelDelegate.findFirst({
      where: {
        [idField]: resourceId,
      },
      select: {
        [idField]: true,
        [tenantField]: true,
      },
    });

    if (!resource) {
      throw new NotFoundException(notFoundMessage);
    }

    const resourceTenantId = resource[tenantField];

    if (!resourceTenantId) {
      throw new ForbiddenException(
        `Resource "${model}" does not expose tenant field "${tenantField}"`,
      );
    }

    if (resourceTenantId !== user.tenantId) {
      throw new ForbiddenException(
        "You do not have access to this tenant resource",
      );
    }

    return true;
  }
}
