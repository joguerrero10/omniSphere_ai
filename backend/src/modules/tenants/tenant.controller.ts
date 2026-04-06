import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ROLES } from '../../common/constant/roles.constants';
import {
  AllowSystemAdminBypass,
} from '../../common/decorators/allow-system-admin-bypass.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  TenantScopedParam,
} from '../../common/decorators/tenant-scoped-param.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenant.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  /**
   * Ruta global: solo super admin puede crear tenants manualmente.
   */
  @Post()
  @Roles(ROLES.ADMIN_SISTEMA)
  create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.create(dto, user.userId);
  }

  /**
   * Ruta global: solo super admin puede listar todos los tenants.
   */
  @Get()
  @Roles(ROLES.ADMIN_SISTEMA)
  findAll() {
    return this.tenantsService.findAll();
  }

  /**
   * Ruta del tenant autenticado.
   * No usa id del cliente: usa user.tenantId.
   */
  @Get('me')
  @Roles(ROLES.ADMIN_TENANT, ROLES.USER, ROLES.ADMIN_SISTEMA)
  findMyTenant(@CurrentUser() user: CurrentUserPayload) {
    return this.tenantsService.findByTenantId(user.tenantId);
  }

  /**
   * Ruta por id con aislamiento por tenant.
   * Un ADMIN_SISTEMA puede entrar por bypass.
   * Un usuario normal solo si el id coincide con su tenant.
   */

  @Get(':id')
  @UseGuards(TenantGuard)
  @TenantScopedParam('id')
  @AllowSystemAdminBypass()
  @Roles(ROLES.ADMIN_TENANT, ROLES.USER, ROLES.ADMIN_SISTEMA)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findByTenantId(id);
  }

  /**
   * Actualización del tenant actual del usuario.
   * Más segura: no acepta id externo.
   */
  @Patch('me')
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  updateMyTenant(
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.update(user.tenantId, dto, user.userId);
  }

  /**
   * Actualización por id con guard multi-tenant.
   * Solo para cuando realmente la necesites.
   */
  @Patch(':id')
  @UseGuards(TenantGuard)
  @TenantScopedParam('id')
  @AllowSystemAdminBypass()
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  updateById(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.update(id, dto, user.userId);
  }
}