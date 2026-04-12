import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ContinueFlowExecutionDto } from "./dto/continue-flow-execution.dto";
import { ExecuteFlowDto } from "./dto/execute-flow.dto";
import { FlowExecutionRuntimeService } from "./flow-execution-runtime.service";

@Injectable()
export class FlowExecutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtime: FlowExecutionRuntimeService,
  ) { }


  async execute(tenantId: string, dto: ExecuteFlowDto) {
    return this.runtime.startExecution({
      ...dto,
      tenantId,
    });
  }

  async continueExecution(tenantId: string, dto: ContinueFlowExecutionDto) {
    const execution = await this.prisma.flowExecution.findUnique({
      where: { id: dto.executionId },
    });

    if (!execution || execution.tenantId !== tenantId) {
      throw new NotFoundException("Flow execution not found");
    }

    return this.runtime.continueExecution(dto);
  }

  async findOne(id: string, tenantId: string) {
    const execution = await this.prisma.flowExecution.findFirst({
      where: { id, tenantId },
      include: {
        steps: {
          orderBy: { stepOrder: "asc" },
        },
        variables: true,
      },
    });

    if (!execution) {
      throw new NotFoundException("Flow execution not found");
    }

    return execution;
  }

  async findSteps(id: string, tenantId: string) {
    await this.ensureExecutionBelongsToTenant(id, tenantId);

    return this.prisma.flowExecutionStep.findMany({
      where: { executionId: id },
      orderBy: { stepOrder: "asc" },
    });
  }

  async findVariables(id: string, tenantId: string) {
    await this.ensureExecutionBelongsToTenant(id, tenantId);

    return this.prisma.flowExecutionVariable.findMany({
      where: { executionId: id },
      orderBy: { key: "asc" },
    });
  }

  private async ensureExecutionBelongsToTenant(id: string, tenantId: string) {
    const execution = await this.prisma.flowExecution.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!execution) {
      throw new NotFoundException("Flow execution not found");
    }

    return execution;
  }
}