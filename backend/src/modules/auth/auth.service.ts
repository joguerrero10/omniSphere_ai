import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ROLES } from "../../common/constant/roles.constants";
import { PrismaService } from "../../database/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName.trim(),
          plan: "FREE",
          createdBy: normalizedEmail,
        },
      });

      const role = await tx.role.create({
        data: {
          name: ROLES.ADMIN_TENANT,
          tenantId: tenant.id,
        },
      });

      const user = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          passwordHash,
          tenantId: tenant.id,
          isActive: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      return { tenant, user, role };
    });

    return {
      message: "User registered successfully",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        tenantId: result.tenant.id,
        roles: [ROLES.USER],
      },
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User is inactive");
    }

    const roles = user.roles.map((userRole) => userRole.role.name);

    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      roles,
    };

    const access_token = await this.jwtService.signAsync(payload);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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