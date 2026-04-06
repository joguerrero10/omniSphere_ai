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
import { ROLES } from '../../common/constant/roles.constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenant.service';


@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) { }

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

  @Get(':id')
  @Roles(ROLES.ADMIN_SISTEMA)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles(ROLES.ADMIN_SISTEMA)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN_SISTEMA)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.remove(id, user.userId);
  }
}