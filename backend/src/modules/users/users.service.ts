import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByTenant(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}