import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { ROLES } from '../../common/constant/roles.constants';
import { AllowSystemAdminBypass } from '../../common/decorators/allow-system-admin-bypass.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantResource } from '../../common/decorators/tenant-resource.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantResourceGuard } from '../../common/guards/tenant-resource.guard';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { QueryUsersDto } from './dto/QueryUsersDto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  create(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.create(actor, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Get()
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  findAll(
    @CurrentUser() actor: CurrentUserPayload,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.findAllByTenant(actor, query);
  }

  @Get('me')
  getMe(@CurrentUser() actor: CurrentUserPayload) {
    return this.usersService.findMe(actor);
  }

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
  findOne(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.usersService.findOneByTenant(id, actor);
  }

  @Patch(':id')
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
  update(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.update(id, actor, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Delete(':id')
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
  remove(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.usersService.remove(id, actor, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Patch(':id/roles')
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
  assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() actor: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.usersService.assignRoles(id, actor, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Patch(':id/reset-password')
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
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() actor: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.usersService.resetPassword(id, actor, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Post('invite')
  @Roles(ROLES.ADMIN_TENANT, ROLES.ADMIN_SISTEMA)
  inviteUser(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: InviteUserDto,
  ) {
    return this.usersService.inviteUser(actor, dto);
  }

  @Post('accept-invitation')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  acceptInvitation(@Body() dto: AcceptInvitationDto, @Req() req: Request) {
    return this.usersService.acceptInvitation(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }
}
