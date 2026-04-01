import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantRateLimitGuard } from '../../common/guards/tenant-rate-limit.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenant.service';


@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard, TenantRateLimitGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) { }

  @Post()
  @Roles('ADMIN_SISTEMA')
  create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user,
  ) {
    return this.tenantsService.create(dto, user.userId);
  }

  @Get()
  @Roles('ADMIN_SISTEMA')
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN_SISTEMA')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN_SISTEMA')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user,
  ) {
    return this.tenantsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles('ADMIN_SISTEMA')
  remove(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return this.tenantsService.remove(id, user.userId);
  }
}