import { Injectable } from '@nestjs/common';
import { FlowVariableType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FlowVariableService {
  constructor(private readonly prisma: PrismaService) { }

  async setVariable(executionId: string, key: string, value: any) {
    const resolvedType = this.resolveType(value);
    const payload = this.buildValuePayload(resolvedType, value);

    return this.prisma.flowExecutionVariable.upsert({
      where: {
        executionId_key: {
          executionId,
          key,
        },
      },
      update: payload,
      create: {
        executionId,
        key,
        ...payload,
      },
    });
  }

  async getVariablesAsObject(executionId: string): Promise<Record<string, any>> {
    const vars = await this.prisma.flowExecutionVariable.findMany({
      where: { executionId },
    });

    const result: Record<string, any> = {};

    for (const item of vars) {
      result[item.key] = this.extractValue(item);
    }

    return result;
  }

  private resolveType(value: any): FlowVariableType {
    if (typeof value === 'string') return FlowVariableType.STRING;
    if (typeof value === 'number') return FlowVariableType.NUMBER;
    if (typeof value === 'boolean') return FlowVariableType.BOOLEAN;
    return FlowVariableType.JSON;
  }

  private buildValuePayload(type: FlowVariableType, value: any) {
    return {
      valueType: type,
      valueString: type === FlowVariableType.STRING ? value : null,
      valueNumber: type === FlowVariableType.NUMBER ? value : null,
      valueBoolean: type === FlowVariableType.BOOLEAN ? value : null,
      valueJson: type === FlowVariableType.JSON ? value : null,
    };
  }

  private extractValue(item: any) {
    switch (item.valueType) {
      case FlowVariableType.STRING:
        return item.valueString;
      case FlowVariableType.NUMBER:
        return item.valueNumber;
      case FlowVariableType.BOOLEAN:
        return item.valueBoolean;
      case FlowVariableType.JSON:
        return item.valueJson;
      default:
        return null;
    }
  }
}