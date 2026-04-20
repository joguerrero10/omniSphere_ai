import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ROLES } from "../../common/constant/roles.constants";
import { AllowSystemAdminBypass } from "../../common/decorators/allow-system-admin-bypass.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { TenantResource } from "../../common/decorators/tenant-resource.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { TenantResourceGuard } from "../../common/guards/tenant-resource.guard";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { TenantsService } from "./tenant.service";

@Controller("tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(ROLES.ADMIN_SISTEMA)
  create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.create(dto, user.userId);
  }

  @Get()
  @Roles(ROLES.ADMIN_SISTEMA)
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get("me")
  @Roles(ROLES.ADMIN_TENANT, ROLES.USER, ROLES.ADMIN_SISTEMA)
  findMyTenant(@CurrentUser() user: CurrentUserPayload) {
    return this.tenantsService.findByTenantId(user.tenantId);
  }

  @Get(":id")
  @UseGuards(TenantResourceGuard)
  @TenantResource({
    model: "tenant",
    paramName: "id",
    tenantField: "id",
    idField: "id",
    notFoundMessage: "Tenant not found",
  })
  @AllowSystemAdminBypass()
  @Roles(ROLES.ADMIN_TENANT, ROLES.USER, ROLES.ADMIN_SISTEMA)
  findOne(@Param("id") id: string) {
    return this.tenantsService.findByTenantId(id);
  }

  @Patch("me")
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  updateMyTenant(
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.update(user.tenantId, dto, user.userId);
  }

  @Patch(":id")
  @UseGuards(TenantResourceGuard)
  @TenantResource({
    model: "tenant",
    paramName: "id",
    tenantField: "id",
    idField: "id",
    notFoundMessage: "Tenant not found",
  })
  @AllowSystemAdminBypass()
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  updateById(
    @Param("id") id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.update(id, dto, user.userId);
  }
  @Delete(":id")
  @UseGuards(TenantResourceGuard)
  @TenantResource({
    model: "tenant",
    paramName: "id",
    tenantField: "id",
    idField: "id",
    notFoundMessage: "Tenant not found",
  })
  @AllowSystemAdminBypass()
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.tenantsService.remove(id, user.userId);
  }

}
