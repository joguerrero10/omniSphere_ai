import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ContinueFlowExecutionDto } from './dto/continue-flow-execution.dto';
import { ExecuteFlowDto } from './dto/execute-flow.dto';
import { FlowExecutionRuntimeService } from './flow-execution-runtime.service';

@Injectable()
export class FlowExecutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtime: FlowExecutionRuntimeService,
  ) { }

  async execute(dto: ExecuteFlowDto) {
    return this.runtime.startExecution(dto);
  }

  async continue(dto: ContinueFlowExecutionDto) {
    return this.runtime.continueExecution(dto);
  }

  async findOne(id: string) {
    const execution = await this.prisma.flowExecution.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        variables: true,
      },
    });

    if (!execution) {
      throw new NotFoundException('Flow execution not found');
    }

    return execution;
  }

  async findSteps(id: string) {
    return this.prisma.flowExecutionStep.findMany({
      where: { executionId: id },
      orderBy: { stepOrder: 'asc' },
    });
  }

  async findVariables(id: string) {
    return this.prisma.flowExecutionVariable.findMany({
      where: { executionId: id },
      orderBy: { key: 'asc' },
    });
  }
}