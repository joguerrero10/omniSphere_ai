import { Module } from "@nestjs/common";
import { CommonModule } from "../../common/common.module";
import { PrismaService } from "../../database/prisma.service";
import { FlowsController } from "./flows.controller";
import { FlowsService } from "./flows.service";

@Module({
  imports: [CommonModule],
  controllers: [FlowsController],
  providers: [FlowsService, PrismaService],
  exports: [FlowsService],
})
export class FlowsModule { }
