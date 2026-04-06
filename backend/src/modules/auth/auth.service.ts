import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { TenantsService } from '../tenants/tenant.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantsService
  ) { }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      roles: user.roles?.map(r => r.role.name) ?? []
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roles: payload.roles
      }
    };
  }

  async register(data: { email: string; password: string; tenantName: string }) {
    const { email, password, tenantName } = data;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          createdBy: email,
          plan: 'FREE',
        },
      });

      const role = await tx.role.create({
        data: {
          name: 'ADMIN_TENANT',
          tenantId: tenant.id,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
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

      return { tenant, user };
    });

    return {
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        tenantId: result.tenant.id,
        roles: ['ADMIN_TENANT'],
      },
    };
  }
}