import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TenantPlan } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { ROLES } from "../../common/constant/roles.constants";
import { PrismaService } from "../../database/prisma.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

interface JwtPayload {
  userId: string;
  tenantId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}
export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
    roles: string[];
  };
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    tenantId: string;
    roles: string[];
  };
}

export interface ChangePasswordResponse {
  message: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    tenantId: string;
    roles: string[];
  };
}
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Registra un nuevo usuario y crea su tenant
   */
  async register(dto: RegisterDto): Promise<RegisterResponse> {
    // Validar entrada
    this.validateRegisterInput(dto);

    const normalizedEmail = dto.email.trim().toLowerCase();

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // Hash de la contraseña
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error hashing password: ${error.message}`);
        throw new InternalServerErrorException("Error processing registration");
      } else {
        this.logger.error(`Error hashing password: ${String(error)}`);
        throw new InternalServerErrorException("Error processing registration");
      }
    }


    // Transacción: crear tenant, rol y usuario
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Crear tenant
        const tenant = await tx.tenant.create({
          data: {
            name: dto.tenantName.trim(),
            plan: "FREE" as TenantPlan,
            // createdById se asignará después de crear el usuario
          },
        });

        // Crear rol de admin para el tenant
        const role = await tx.role.create({
          data: {
            name: ROLES.ADMIN_TENANT,
            tenantId: tenant.id,
          },
        });

        // Crear usuario
        const user = await tx.user.create({
          data: {
            name: dto.name.trim(),
            email: normalizedEmail,
            passwordHash,
            tenantId: tenant.id,
            isActive: true,
          },
        });

        // Asignar rol al usuario
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });

        // Actualizar tenant con el ID del usuario creador
        await tx.tenant.update({
          where: { id: tenant.id },
          data: { createdById: user.id },
        });

        return { tenant, user, role };
      });

      this.logger.log(`User registered successfully: ${normalizedEmail}`);

      return {
        message: "User registered successfully",
        user: {
          id: result.user.id,
          name: result.user.name || "",
          email: result.user.email,
          tenantId: result.tenant.id,
          roles: [ROLES.ADMIN_TENANT],
        },
      };
    } catch (error) {
      this.logger.error(`Registration error for ${normalizedEmail}:`, error);
      throw new InternalServerErrorException("Error during registration");
    }
  }

  /**
   * Realiza login del usuario
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    // Validar entrada
    this.validateLoginInput(dto);

    const normalizedEmail = dto.email.trim().toLowerCase();

    // Obtener usuario con sus roles
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        tenant: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    // Usuario no existe
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Validar que el usuario está activo
    if (!user.isActive) {
      this.logger.warn(`Inactive user attempted login: ${normalizedEmail}`);
      throw new UnauthorizedException("User is inactive");
    }

    // Validar que el tenant está activo (opcional pero recomendado)
    if (!user.tenant || !user.tenant.isActive) {
      this.logger.warn(`Inactive tenant for user: ${normalizedEmail}`);
      throw new UnauthorizedException("Tenant is inactive");
    }

    // Validar contraseña
    let isPasswordValid: boolean;
    try {
      isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    } catch (error) {
      this.logger.error(`Error comparing passwords for ${normalizedEmail}`);
      throw new InternalServerErrorException("Error during authentication");
    }

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password attempt for: ${normalizedEmail}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    // Extraer roles
    const roles = user.roles.map((userRole) => userRole.role.name);

    // Crear payload JWT
    const payload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      roles,
    };

    // Generar JWT
    let access_token: string;
    try {
      access_token = await this.jwtService.signAsync(payload);
    } catch (error) {
      this.logger.error(`Error signing JWT for ${normalizedEmail}`);
      throw new InternalServerErrorException("Error generating token");
    }

    // Actualizar último login (sin bloquear si falla)
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      this.logger.warn(`Failed to update lastLoginAt for ${normalizedEmail}`);
    }

    this.logger.log(`User logged in successfully: ${normalizedEmail}`);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        roles,
      },
    };
  }

  private validateRegisterInput(dto: RegisterDto): void {
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException("Email is required");
    }

    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException(
        "Password must be at least 8 characters long"
      );
    }

    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException("Name is required");
    }

    if (!dto.tenantName || !dto.tenantName.trim()) {
      throw new BadRequestException("Tenant name is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      throw new BadRequestException("Invalid email format");
    }
  }

  private validateLoginInput(dto: LoginDto): void {
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException("Email is required");
    }

    if (!dto.password || !dto.password.trim()) {
      throw new BadRequestException("Password is required");
    }
  }
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException("New passwords do not match");
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        "New password must be different from current password"
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User is inactive");
    }

    let isCurrentPasswordValid: boolean;
    try {
      isCurrentPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash
      );
    } catch (error) {
      this.logger.error(`Error comparing passwords for user ${userId}`);
      throw new InternalServerErrorException(
        "Error during password change"
      );
    }

    if (!isCurrentPasswordValid) {
      this.logger.warn(`Invalid current password for user ${userId}`);
      throw new UnauthorizedException("Current password is incorrect");
    }

    let newPasswordHash: string;
    try {
      newPasswordHash = await bcrypt.hash(
        dto.newPassword,
        this.BCRYPT_ROUNDS
      );
    } catch (error) {
      this.logger.error(`Error hashing new password for user ${userId}`);
      throw new InternalServerErrorException(
        "Error processing password change"
      );
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      this.logger.log(`Password changed for user: ${user.email}`);

      return {
        message: "Password changed successfully",
      };
    } catch (error) {
      this.logger.error(`Error updating password for user ${userId}:`, error);
      throw new InternalServerErrorException("Error updating password");
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    if (!refreshToken || !refreshToken.trim()) {
      throw new BadRequestException("Refresh token is required");
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      this.logger.warn("Invalid or expired refresh token");
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        tenant: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User is inactive");
    }

    if (!user.tenant || !user.tenant.isActive) {
      throw new UnauthorizedException("Tenant is inactive");
    }

    const roles = user.roles.map((userRole) => userRole.role.name);

    const newPayload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      roles,
    };

    let access_token: string;
    try {
      access_token = await this.jwtService.signAsync(newPayload);
    } catch (error) {
      this.logger.error(
        `Error signing new JWT for user ${user.id}`
      );
      throw new InternalServerErrorException("Error generating token");
    }

    this.logger.log(`Token refreshed for user: ${user.email}`);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        roles,
      },
    };
  }
}