import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator personalizado para inyectar el usuario autenticado
 * 
 * Uso:
 * @Get()
 * findAll(@GetUser() user: { userId: string; companyId: string }) {
 *   return this.botsService.findAll(user.companyId);
 * }
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);

/**
 * Decorator para inyectar solo el companyId del usuario
 * 
 * Uso:
 * @Get()
 * findAll(@GetCompanyId() companyId: string) {
 *   return this.botsService.findAll(companyId);
 * }
 */
export const GetCompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user?.companyId || request.user?.tenantId;
  },
);

/**
 * Decorator para inyectar solo el userId del usuario
 * 
 * Uso:
 * @Get()
 * getProfile(@GetUserId() userId: string) {
 *   return this.usersService.getProfile(userId);
 * }
 */
export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user?.userId;
  },
);

/**
 * Decorator para inyectar los roles del usuario
 * 
 * Uso:
 * @Get()
 * findAll(@GetRoles() roles: string[]) {
 *   // roles es un array de roles del usuario
 * }
 */
export const GetRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user?.roles || [];
  },
);