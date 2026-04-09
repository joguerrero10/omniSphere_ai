import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FlowEdgeConditionType,
  FlowExecutionStatus,
  FlowNodeType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ContinueFlowExecutionDto } from './dto/continue-flow-execution.dto';
import { ExecuteFlowDto } from './dto/execute-flow.dto';
import { FlowVariableService } from './flow-variable.service';

type StartExecutionInput = ExecuteFlowDto & {
  tenantId: string;
};
@Injectable()
export class FlowExecutionRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly variableService: FlowVariableService,
  ) { }

  async startExecution(dto: StartExecutionInput) {
    const flow = await this.prisma.flow.findFirst({
      where: {
        id: dto.flowId,
        tenantId: dto.tenantId,
      },
      include: {
        nodes: true,
      },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    const entryNode = flow.nodes.find((node) => node.isEntry === true);

    if (!entryNode) {
      throw new BadRequestException('Flow does not have an entry node');
    }

    const execution = await this.prisma.flowExecution.create({
      data: {
        tenantId: dto.tenantId,
        flowId: dto.flowId,
        currentNodeId: entryNode.id,
        status: FlowExecutionStatus.RUNNING,
        sessionId: dto.sessionId,
        userId: dto.userId,
        channel: dto.channel,
        lastInputText: dto.inputText,
        contextJson: this.toPrismaJson(dto.payload),
      },
    });

    if (dto.inputText) {
      await this.variableService.setVariable(
        execution.id,
        'lastUserInput',
        dto.inputText,
      );
    }

    return this.run(execution.id, dto.inputText, dto.payload ?? {});
  }

  async continueExecution(dto: ContinueFlowExecutionDto) {
    const execution = await this.prisma.flowExecution.findUnique({
      where: { id: dto.executionId },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    if (
      execution.status !== FlowExecutionStatus.WAITING_INPUT &&
      execution.status !== FlowExecutionStatus.RUNNING
    ) {
      throw new BadRequestException(
        `Execution cannot continue from status ${execution.status}`,
      );
    }

    await this.prisma.flowExecution.update({
      where: { id: execution.id },
      data: {
        status: FlowExecutionStatus.RUNNING,
        lastInputText: dto.inputText,
        contextJson: this.mergeContextJson(dto.payload, execution.contextJson),
      },
    });

    if (dto.inputText) {
      await this.variableService.setVariable(
        execution.id,
        'lastUserInput',
        dto.inputText,
      );
    }

    return this.run(execution.id, dto.inputText, dto.payload ?? {});
  }

  private async run(
    executionId: string,
    inputText?: string,
    payload?: Record<string, any>,
  ) {
    const actions: Array<Record<string, unknown>> = [];
    let safeCounter = 0;

    while (safeCounter < 50) {
      safeCounter++;

      const execution = await this.prisma.flowExecution.findUnique({
        where: { id: executionId },
      });

      if (!execution) {
        throw new NotFoundException('Execution not found');
      }

      if (!execution.currentNodeId) {
        await this.finishExecution(executionId);

        return {
          executionId,
          status: 'COMPLETED',
          currentNodeId: null,
          actions: [...actions, { type: 'END' }],
          variables: await this.variableService.getVariablesAsObject(executionId),
        };
      }

      const node = await this.prisma.flowNode.findUnique({
        where: { id: execution.currentNodeId },
      });

      if (!node) {
        await this.failExecution(executionId, 'Current node not found');

        return {
          executionId,
          status: 'FAILED',
          currentNodeId: execution.currentNodeId,
          actions,
        };
      }

      const variables =
        await this.variableService.getVariablesAsObject(executionId);

      switch (node.type) {
        case FlowNodeType.START: {
          await this.logStep({
            executionId,
            nodeId: node.id,
            nodeType: node.type,
            inputText,
            outputJson: { started: true },
          });

          const nextNodeId = await this.getDefaultNextNodeId(node.id);

          if (!nextNodeId) {
            await this.finishExecution(executionId);

            return {
              executionId,
              status: 'COMPLETED',
              currentNodeId: null,
              actions: [...actions, { type: 'END' }],
              variables,
            };
          }

          await this.prisma.flowExecution.update({
            where: { id: executionId },
            data: { currentNodeId: nextNodeId },
          });

          continue;
        }

        case FlowNodeType.MESSAGE: {
          const config = this.asRecord(node.config);
          const template =
            config && typeof config.message === 'string'
              ? config.message
              : '';

          const message = this.renderTemplate(template, variables);

          actions.push({
            type: 'MESSAGE',
            content: message,
          });

          await this.logStep({
            executionId,
            nodeId: node.id,
            nodeType: node.type,
            inputText,
            outputJson: { message },
          });

          const nextNodeId = await this.getDefaultNextNodeId(node.id);

          if (!nextNodeId) {
            await this.finishExecution(executionId);

            return {
              executionId,
              status: 'COMPLETED',
              currentNodeId: null,
              actions: [...actions, { type: 'END' }],
              variables,
            };
          }

          await this.prisma.flowExecution.update({
            where: { id: executionId },
            data: { currentNodeId: nextNodeId },
          });

          continue;
        }

        case FlowNodeType.CONDITION: {
          const result = this.evaluateCondition(node.config, {
            inputText,
            payload,
            variables,
          });

          const nextNodeId = await this.getConditionalNextNodeId(node.id, result);

          await this.logStep({
            executionId,
            nodeId: node.id,
            nodeType: node.type,
            inputText,
            outputJson: { conditionResult: result },
          });

          if (!nextNodeId) {
            await this.finishExecution(executionId);

            return {
              executionId,
              status: 'COMPLETED',
              currentNodeId: null,
              actions: [...actions, { type: 'END' }],
              variables,
            };
          }

          await this.prisma.flowExecution.update({
            where: { id: executionId },
            data: { currentNodeId: nextNodeId },
          });

          continue;
        }

        case FlowNodeType.INTENT: {
          const detectedIntent = this.mockIntentDetection(inputText);

          await this.variableService.setVariable(
            executionId,
            'detectedIntent',
            detectedIntent,
          );

          const nextNodeId = await this.getIntentNextNodeId(node.id, detectedIntent);

          await this.logStep({
            executionId,
            nodeId: node.id,
            nodeType: node.type,
            inputText,
            outputJson: { detectedIntent },
          });

          if (!nextNodeId) {
            await this.prisma.flowExecution.update({
              where: { id: executionId },
              data: {
                status: FlowExecutionStatus.WAITING_INPUT,
              },
            });

            actions.push({
              type: 'WAIT_INPUT',
              nodeId: node.id,
            });

            return {
              executionId,
              status: 'WAITING_INPUT',
              currentNodeId: node.id,
              actions,
              variables: await this.variableService.getVariablesAsObject(executionId),
            };
          }

          await this.prisma.flowExecution.update({
            where: { id: executionId },
            data: { currentNodeId: nextNodeId },
          });

          continue;
        }

        case FlowNodeType.WEBHOOK: {
          const webhookResult = {
            ok: true,
            mocked: true,
          };

          actions.push({
            type: 'WEBHOOK_RESULT',
            data: webhookResult,
          });

          await this.logStep({
            executionId,
            nodeId: node.id,
            nodeType: node.type,
            inputText,
            outputJson: webhookResult,
          });

          const nextNodeId = await this.getDefaultNextNodeId(node.id);

          if (!nextNodeId) {
            await this.finishExecution(executionId);

            return {
              executionId,
              status: 'COMPLETED',
              currentNodeId: null,
              actions: [...actions, { type: 'END' }],
              variables: await this.variableService.getVariablesAsObject(executionId),
            };
          }

          await this.prisma.flowExecution.update({
            where: { id: executionId },
            data: { currentNodeId: nextNodeId },
          });

          continue;
        }

        case FlowNodeType.ACTION: {
          const actionResult = {
            ok: true,
            mocked: true,
          };

          actions.push({
            type: 'ACTION_RESULT',
            data: actionResult,
          });

          await this.logStep({
            executionId,
            nodeId: node.id,
            nodeType: node.type,
            inputText,
            outputJson: actionResult,
          });

          const nextNodeId = await this.getDefaultNextNodeId(node.id);

          if (!nextNodeId) {
            await this.finishExecution(executionId);

            return {
              executionId,
              status: 'COMPLETED',
              currentNodeId: null,
              actions: [...actions, { type: 'END' }],
              variables: await this.variableService.getVariablesAsObject(executionId),
            };
          }

          await this.prisma.flowExecution.update({
            where: { id: executionId },
            data: { currentNodeId: nextNodeId },
          });

          continue;
        }

        case FlowNodeType.END: {
          await this.logStep({
            executionId,
            nodeId: node.id,
            nodeType: node.type,
            inputText,
            outputJson: { ended: true },
          });

          await this.finishExecution(executionId);

          return {
            executionId,
            status: 'COMPLETED',
            currentNodeId: null,
            actions: [...actions, { type: 'END' }],
            variables,
          };
        }

        default: {
          await this.failExecution(
            executionId,
            `Unsupported node type: ${node.type}`,
          );

          return {
            executionId,
            status: 'FAILED',
            currentNodeId: node.id,
            actions,
          };
        }
      }
    }

    await this.failExecution(executionId, 'Execution stopped by safety limit');

    return {
      executionId,
      status: 'FAILED',
      currentNodeId: null,
      actions,
    };
  }

  private async finishExecution(executionId: string) {
    await this.prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: FlowExecutionStatus.COMPLETED,
        currentNodeId: null,
        finishedAt: new Date(),
      },
    });
  }

  private async failExecution(executionId: string, errorMessage: string) {
    await this.prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: FlowExecutionStatus.FAILED,
        errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  private async logStep(params: {
    executionId: string;
    nodeId: string;
    nodeType: FlowNodeType;
    inputText?: string;
    outputJson?: Prisma.InputJsonValue;
  }) {
    const count = await this.prisma.flowExecutionStep.count({
      where: { executionId: params.executionId },
    });

    await this.prisma.flowExecutionStep.create({
      data: {
        executionId: params.executionId,
        nodeId: params.nodeId,
        nodeType: params.nodeType,
        stepOrder: count + 1,
        inputText: params.inputText,
        outputJson: params.outputJson,
      },
    });
  }

  private renderTemplate(template: string, variables: Record<string, unknown>) {
    if (!template) return '';

    return template.replace(/\{\{(.*?)\}\}/g, (_, key: string) => {
      const value = variables[key.trim()];
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  private evaluateCondition(
    configJson: Prisma.JsonValue | null,
    context: {
      inputText?: string;
      payload?: Record<string, unknown>;
      variables: Record<string, unknown>;
    },
  ): boolean {
    const config = this.asRecord(configJson);

    if (!config) {
      return false;
    }

    if (config.type === 'equals') {
      const variableName =
        typeof config.variable === 'string' ? config.variable : '';
      const left = context.variables[variableName];
      return left === config.value;
    }

    if (config.type === 'containsText') {
      const searchValue =
        config.value !== undefined && config.value !== null
          ? String(config.value).toLowerCase()
          : '';

      return (context.inputText || '').toLowerCase().includes(searchValue);
    }

    return false;
  }

  private mockIntentDetection(inputText?: string): string {
    const text = (inputText || '').toLowerCase();

    if (text.includes('precio')) return 'ASK_PRICE';
    if (text.includes('horario')) return 'ASK_SCHEDULE';
    if (text.includes('soporte')) return 'ASK_SUPPORT';

    return 'FALLBACK';
  }

  private async getDefaultNextNodeId(nodeId: string): Promise<string | null> {
    const edge = await this.prisma.flowEdge.findFirst({
      where: {
        sourceNodeId: nodeId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return edge?.targetNodeId ?? null;
  }

  private async getConditionalNextNodeId(
    nodeId: string,
    result: boolean,
  ): Promise<string | null> {
    const edge = await this.prisma.flowEdge.findFirst({
      where: {
        sourceNodeId: nodeId,
        conditionType: result
          ? FlowEdgeConditionType.TRUE
          : FlowEdgeConditionType.FALSE,
      },
    });

    return edge?.targetNodeId ?? null;
  }

  private async getIntentNextNodeId(
    nodeId: string,
    intent: string,
  ): Promise<string | null> {
    const exact = await this.prisma.flowEdge.findFirst({
      where: {
        sourceNodeId: nodeId,
        intentName: intent,
      },
    });

    if (exact) {
      return exact.targetNodeId;
    }

    const fallback = await this.prisma.flowEdge.findFirst({
      where: {
        sourceNodeId: nodeId,
        isFallback: true,
      },
    });

    return fallback?.targetNodeId ?? null;
  }

  private asRecord(
    value: Prisma.JsonValue | null,
  ): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private toPrismaJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue {
    return (value ?? {}) as Prisma.InputJsonValue;
  }

  private mergeContextJson(
    payload: Record<string, unknown> | undefined,
    current: Prisma.JsonValue | null,
  ): Prisma.InputJsonValue {
    if (payload !== undefined) {
      return payload as Prisma.InputJsonValue;
    }

    if (current !== null) {
      return current as Prisma.InputJsonValue;
    }

    return {} as Prisma.InputJsonValue;
  }
}