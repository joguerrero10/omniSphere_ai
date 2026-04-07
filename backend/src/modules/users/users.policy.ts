import { ForbiddenException, Injectable } from "@nestjs/common";
import { RoleName, ROLES } from "../../common/constant/roles.constants";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";

@Injectable()
export class UsersPolicy {
  canCreate(actor: CurrentUserPayload): void {
    if (
      !actor.roles.includes(ROLES.ADMIN_TENANT) &&
      !actor.roles.includes(ROLES.ADMIN_SISTEMA)
    ) {
      throw new ForbiddenException("You cannot create users");
    }
  }

  canList(actor: CurrentUserPayload): void {
    if (
      !actor.roles.includes(ROLES.ADMIN_TENANT) &&
      !actor.roles.includes(ROLES.ADMIN_SISTEMA)
    ) {
      throw new ForbiddenException("You cannot list users");
    }
  }

  canUpdate(actor: CurrentUserPayload): void {
    if (
      !actor.roles.includes(ROLES.ADMIN_TENANT) &&
      !actor.roles.includes(ROLES.ADMIN_SISTEMA)
    ) {
      throw new ForbiddenException("You cannot update users");
    }
  }

  canDelete(actor: CurrentUserPayload): void {
    if (
      !actor.roles.includes(ROLES.ADMIN_TENANT) &&
      !actor.roles.includes(ROLES.ADMIN_SISTEMA)
    ) {
      throw new ForbiddenException("You cannot delete users");
    }
  }

  canAssignRoles(actor: CurrentUserPayload, rolesToAssign: RoleName[]): void {
    if (actor.roles.includes(ROLES.ADMIN_SISTEMA)) {
      return;
    }

    if (!actor.roles.includes(ROLES.ADMIN_TENANT)) {
      throw new ForbiddenException("You cannot assign roles");
    }

    if (rolesToAssign.includes(ROLES.ADMIN_SISTEMA)) {
      throw new ForbiddenException("ADMIN_TENANT cannot assign ADMIN_SISTEMA");
    }
  }

  canResetPassword(actor: CurrentUserPayload): void {
    if (
      !actor.roles.includes(ROLES.ADMIN_TENANT) &&
      !actor.roles.includes(ROLES.ADMIN_SISTEMA)
    ) {
      throw new ForbiddenException("You cannot reset passwords");
    }
  }
}
