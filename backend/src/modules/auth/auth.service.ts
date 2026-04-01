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

  // -----------------------------
  // LOGIN
  // -----------------------------
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

  // -----------------------------
  // REGISTER
  // -----------------------------
  async register(data: { email: string; password: string; tenantName: string }) {
    const { email, password, tenantName } = data;

    // Validar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // 1️⃣ Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 2️⃣ Crear tenant automáticamente
    const tenant = await this.tenantService.createTenant(tenantName, email);
    if (!tenant) {
      throw new BadRequestException('Error creating tenant');
    }

    // 3️⃣ Crear usuario vinculado al tenant
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        tenantId: tenant.id
      }
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        tenantId: tenant.id
      }
    };
  }
}