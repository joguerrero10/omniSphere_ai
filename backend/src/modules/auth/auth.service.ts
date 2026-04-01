import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {

  constructor(private readonly jwtService: JwtService, private prisma: PrismaService) { }

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

  async register(data: { email: string; password: string; tenantId: string }) {
    const { email, password, tenantId } = data;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        tenantId
      }
    });
    return {
      message: 'User registered successfully',
      user
    }
  }
}
