import { Module } from "@nestjs/common";
import { AuditService } from "../../common/audit/audit.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { TenantResourceGuard } from "../../common/guards/tenant-resource.guard";
import { MailModule } from "../../common/mail/mail.module";
import { PrismaService } from "../../database/prisma.service";
import { UsersController } from "./users.controller";
import { UsersPolicy } from "./users.policy";
import { UsersService } from "./users.service";

@Module({
  imports: [MailModule],
  providers: [
    UsersService,
    UsersPolicy,
    PrismaService,
    AuditService,
    RolesGuard,
    TenantResourceGuard,
  ],
  controllers: [UsersController],
})
export class UsersModule {}
