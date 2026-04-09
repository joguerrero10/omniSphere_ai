import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = config.get<string>("JWT_SECRET");

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: CurrentUserPayload): Promise<CurrentUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: {
          include: {
            role: true,
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

    if (user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException("Invalid tenant for token");
    }

    const roles: CurrentUserPayload["roles"] = user.roles.map(
      (item) => item.role.name as CurrentUserPayload["roles"][number],
    );

    return {
      userId: user.id,
      tenantId: user.tenantId,
      roles,
    };
  }
}