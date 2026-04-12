import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { AuditService } from "../../common/audit/audit.service";
import { RoleName, ROLES } from "../../common/constant/roles.constants";
import { AuditContext } from "../../common/interfaces/audit-context.interface";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { MailService } from "../../common/mail/mail.service";
import { PrismaService } from "../../database/prisma.service";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { AssignRolesDto } from "./dto/assign-roles.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { InviteUserDto } from "./dto/invite-user.dto";
import { QueryUsersDto } from "./dto/QueryUsersDto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { UsersPolicy } from "./users.policy";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly usersPolicy: UsersPolicy,
    private readonly mailService: MailService,
  ) { }

  private async ensureTenantAdminNotRemovingOwnLastAdminRole(
    targetUserId: string,
    actor: CurrentUserPayload,
    nextRoles: RoleName[],
  ): Promise<void> {
    const isSelf = targetUserId === actor.userId;

    if (!isSelf) {
      return;
    }

    const currentUser = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        tenantId: actor.tenantId,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    const currentRoles = currentUser.roles.map(
      (userRole) => userRole.role.name as RoleName,
    );

    const currentlyIsAdminTenant = currentRoles.includes(ROLES.ADMIN_TENANT);
    const willRemainAdminTenant = nextRoles.includes(ROLES.ADMIN_TENANT);

    if (!currentlyIsAdminTenant || willRemainAdminTenant) {
      return;
    }

    const tenantAdminsCount = await this.prisma.user.count({
      where: {
        tenantId: actor.tenantId,
        isActive: true,
        roles: {
          some: {
            role: {
              name: ROLES.ADMIN_TENANT,
            },
          },
        },
      },
    });

    if (tenantAdminsCount <= 1) {
      throw new BadRequestException(
        "You cannot remove your own last ADMIN_TENANT role",
      );
    }
  }

  private async ensureTenantAdminNotDeactivatingSelfAsLastAdmin(
    targetUserId: string,
    actor: CurrentUserPayload,
  ): Promise<void> {
    const isSelf = targetUserId === actor.userId;

    if (!isSelf) {
      return;
    }

    const currentUser = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        tenantId: actor.tenantId,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    const currentRoles = currentUser.roles.map(
      (userRole) => userRole.role.name as RoleName,
    );

    if (!currentRoles.includes(ROLES.ADMIN_TENANT)) {
      return;
    }

    const tenantAdminsCount = await this.prisma.user.count({
      where: {
        tenantId: actor.tenantId,
        isActive: true,
        roles: {
          some: {
            role: {
              name: ROLES.ADMIN_TENANT,
            },
          },
        },
      },
    });

    if (tenantAdminsCount <= 1) {
      throw new BadRequestException(
        "You cannot deactivate your own account as the last ADMIN_TENANT",
      );
    }
  }

  private mapUserResponse(
    user: User & { roles?: { role: { name: string } }[] },
  ): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: (user.roles ?? []).map((ur) => ur.role.name as RoleName),
    };
  }

  async create(
    actor: CurrentUserPayload,
    dto: CreateUserDto,
    auditContext?: AuditContext,
  ): Promise<UserResponseDto> {
    this.usersPolicy.canCreate(actor);

    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const rolesToAssign: RoleName[] =
      dto.roles && dto.roles.length > 0 ? dto.roles : [ROLES.USER];

    this.usersPolicy.canAssignRoles(actor, rolesToAssign);

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name,
          passwordHash,
          tenantId: actor.tenantId,
          isActive: true,
        },
      });

      const tenantRoles = await tx.role.findMany({
        where: {
          tenantId: actor.tenantId,
          name: { in: rolesToAssign },
        },
      });

      const foundRoleNames = tenantRoles.map((r) => r.name);
      const missingRoles = rolesToAssign.filter(
        (role) => !foundRoleNames.includes(role),
      );

      if (missingRoles.length > 0) {
        for (const roleName of missingRoles) {
          const newRole = await tx.role.create({
            data: {
              name: roleName,
              tenantId: actor.tenantId,
            },
          });
          tenantRoles.push(newRole);
        }
      }

      await tx.userRole.createMany({
        data: tenantRoles.map((role) => ({
          userId: user.id,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    if (!createdUser) {
      throw new BadRequestException("User could not be created");
    }

    await this.audit.log(
      `User created: ${createdUser.email}`,
      actor.tenantId,
      actor.userId,
      {
        targetUserId: createdUser.id,
        ...auditContext,
      },
    );

    return this.mapUserResponse(createdUser);
  }

  async findAllByTenant(
    actor: CurrentUserPayload,
    query: QueryUsersDto,
  ): Promise<{
    data: UserResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    this.usersPolicy.canList(actor);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      tenantId: actor.tenantId,
      ...(query.search
        ? {
          OR: [
            { email: { contains: query.search, mode: "insensitive" } },
            { name: { contains: query.search, mode: "insensitive" } },
          ],
        }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.mapUserResponse(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMe(actor: CurrentUserPayload): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: actor.userId,
        tenantId: actor.tenantId,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.mapUserResponse(user);
  }

  async findOneByTenant(
    id: string,
    actor: CurrentUserPayload,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId: actor.tenantId,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.mapUserResponse(user);
  }

  async update(
    id: string,
    actor: CurrentUserPayload,
    dto: UpdateUserDto,
    auditContext?: AuditContext,
  ): Promise<UserResponseDto> {
    this.usersPolicy.canUpdate(actor);

    await this.ensureSameTenantUser(id, actor.tenantId);

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          email: dto.email,
          name: dto.name,
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      await this.audit.log(
        `User updated: ${updatedUser.email}`,
        actor.tenantId,
        actor.userId,
        {
          targetUserId: updatedUser.id,
          ...auditContext,
        },
      );

      return this.mapUserResponse(updatedUser);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Email already in use");
      }
      throw error;
    }
  }

  async remove(
    id: string,
    actor: CurrentUserPayload,
    auditContext?: AuditContext,
  ): Promise<{ message: string }> {
    this.usersPolicy.canDelete(actor);

    const user = await this.ensureSameTenantUser(id, actor.tenantId);

    if (user.id === actor.userId) {
      throw new BadRequestException("You cannot delete your own account");
    }

    await this.ensureTenantAdminNotDeactivatingSelfAsLastAdmin(id, actor);

    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    await this.audit.log(
      `User deactivated: ${user.email}`,
      actor.tenantId,
      actor.userId,
      {
        targetUserId: user.id,
        ...auditContext,
      },
    );

    return {
      message: "User deactivated successfully",
    };
  }

  async assignRoles(
    id: string,
    actor: CurrentUserPayload,
    dto: AssignRolesDto,
    auditContext?: AuditContext,
  ): Promise<UserResponseDto> {
    this.usersPolicy.canAssignRoles(actor, dto.roles);

    await this.ensureTenantAdminNotRemovingOwnLastAdminRole(
      id,
      actor,
      dto.roles,
    );

    const user = await this.ensureSameTenantUser(id, actor.tenantId);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: {
          userId: user.id,
        },
      });

      let roles = await tx.role.findMany({
        where: {
          tenantId: actor.tenantId,
          name: { in: dto.roles },
        },
      });

      const foundRoleNames = roles.map((r) => r.name);
      const missingRoles = dto.roles.filter(
        (role) => !foundRoleNames.includes(role),
      );

      if (missingRoles.length > 0) {
        for (const roleName of missingRoles) {
          const newRole = await tx.role.create({
            data: {
              name: roleName,
              tenantId: actor.tenantId,
            },
          });
          roles.push(newRole);
        }
      }

      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId: user.id,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    await this.audit.log(
      `Roles updated for user: ${updatedUser.email}`,
      actor.tenantId,
      actor.userId,
      {
        targetUserId: updatedUser.id,
        ...auditContext,
      },
    );

    return this.mapUserResponse(updatedUser);
  }

  async resetPassword(
    id: string,
    actor: CurrentUserPayload,
    dto: ResetPasswordDto,
    auditContext?: AuditContext,
  ): Promise<{ message: string }> {
    this.usersPolicy.canResetPassword(actor);

    const user = await this.ensureSameTenantUser(id, actor.tenantId);

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.audit.log(
      `Password reset for user: ${user.email}`,
      actor.tenantId,
      actor.userId,
      {
        targetUserId: user.id,
        ...auditContext,
      },
    );

    return {
      message: "Password reset successfully",
    };
  }

  private async ensureSameTenantUser(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async inviteUser(
    actor: CurrentUserPayload,
    dto: InviteUserDto,
  ): Promise<{ message: string }> {
    this.usersPolicy.canCreate(actor);

    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const rolesToAssign: RoleName[] =
      dto.roles && dto.roles.length > 0 ? dto.roles : [ROLES.USER];

    this.usersPolicy.canAssignRoles(actor, rolesToAssign);

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const invitation = await this.prisma.userInvitation.create({
      data: {
        email: normalizedEmail,
        tenantId: actor.tenantId,
        token: tokenHash,
        roles: rolesToAssign,
        expiresAt,
      },
    });

    try {
      await this.mailService.sendUserInvitationEmail(normalizedEmail, token);
    } catch {
      await this.prisma.userInvitation.delete({
        where: { id: invitation.id },
      });

      throw new BadRequestException("Invitation could not be sent by email");
    }

    await this.audit.log(
      `User invitation sent to: ${normalizedEmail}`,
      actor.tenantId,
      actor.userId,
      {
        invitationId: invitation.id,
        invitedEmail: normalizedEmail,
      },
    );

    return {
      message: "Invitation sent successfully",
    };
  }

  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<{ message: string }> {
    const tokenHash = createHash("sha256").update(dto.token).digest("hex");

    const invitation = await this.prisma.userInvitation.findUnique({
      where: { token: tokenHash },
    });

    if (!invitation) {
      throw new BadRequestException("Invalid invitation token");
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException("Invitation already accepted");
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException("Invitation expired");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const roles = Array.isArray(invitation.roles)
      ? (invitation.roles as RoleName[])
      : [ROLES.USER];

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          name: dto.name,
          passwordHash,
          tenantId: invitation.tenantId,
          isActive: true,
        },
      });

      let tenantRoles = await tx.role.findMany({
        where: {
          tenantId: invitation.tenantId,
          name: { in: roles },
        },
      });

      const foundRoleNames = tenantRoles.map((r) => r.name);
      const missingRoles = roles.filter(
        (role) => !foundRoleNames.includes(role),
      );

      if (missingRoles.length > 0) {
        for (const roleName of missingRoles) {
          const newRole = await tx.role.create({
            data: {
              name: roleName,
              tenantId: invitation.tenantId,
            },
          });
          tenantRoles.push(newRole);
        }
      }

      await tx.userRole.createMany({
        data: tenantRoles.map((role) => ({
          userId: user.id,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });

      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
        },
      });
    });

    return {
      message: "Invitation accepted successfully",
    };
  }
}
