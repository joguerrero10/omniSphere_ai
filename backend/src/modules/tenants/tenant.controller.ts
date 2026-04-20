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
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { TenantsService } from "./tenant.service";

@Controller("tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(ROLES.ADMIN_SISTEMA, ROLES.ADMIN_TENANT)
  create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.create(dto, user.userId);
  }

  @Get()
  @Roles(ROLES.ADMIN_TENANT, ROLES.USER, ROLES.ADMIN_SISTEMA)
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.tenantsService.findVisibleForUser(user);
  }

  @Get("me")
  @Roles(ROLES.ADMIN_TENANT, ROLES.USER, ROLES.ADMIN_SISTEMA)
  findMyTenant(@CurrentUser() user: CurrentUserPayload) {
    return this.tenantsService.findByTenantId(user.tenantId);
  }

  @Get(":id")
  @Roles(ROLES.ADMIN_TENANT, ROLES.USER, ROLES.ADMIN_SISTEMA)
  findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.tenantsService.findOneVisibleForUser(id, user);
  }

  @Patch("me")
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  updateMyTenant(
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.update(user.tenantId, dto, user);
  }

  @Patch(":id")
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  updateById(
    @Param("id") id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.update(id, dto, user);
  }
  @Delete(":id")
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.tenantsService.remove(id, user);
  }
}
