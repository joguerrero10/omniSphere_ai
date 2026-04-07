import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ROLES } from '../../common/constant/roles.constants';
import { AllowSystemAdminBypass } from '../../common/decorators/allow-system-admin-bypass.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantResource } from '../../common/decorators/tenant-resource.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantResourceGuard } from '../../common/guards/tenant-resource.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get(':id')
  @UseGuards(TenantResourceGuard)
  @TenantResource({
    model: 'user',
    paramName: 'id',
    tenantField: 'tenantId',
    idField: 'id',
    notFoundMessage: 'User not found',
  })
  @AllowSystemAdminBypass()
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}