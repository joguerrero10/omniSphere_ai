import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FlowStatus,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { CreateFlowEdgeDto } from './dto/create-flow-edge.dto';
import { CreateFlowNodeDto } from './dto/create-flow-node.dto';
import { CreateFlowTriggerDto } from './dto/create-flow-trigger.dto';
import { CreateFlowVariableDto } from './dto/create-flow-variable.dto';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowNodeDto } from './dto/update-flow-node.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';

@Injectable()
export class FlowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  async create(actor: CurrentUserPayload, dto: CreateFlowDto) {
    const flow = await this.prisma.flow.create({
      data: {
        tenantId: actor.tenantId,
        name: dto.name,
        description: dto.description,
        status: dto.status ?? FlowStatus.DRAFT,
        createdBy: actor.userId,
        ...(dto.metadata !== undefined
          ? { metadata: dto.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.audit.log(
      `Flow created: ${flow.name}`,
      actor.tenantId,
      actor.userId,
      { flowId: flow.id },
    );

    return flow;
  }

  async findAll(actor: CurrentUserPayload) {
    return this.prisma.flow.findMany({
      where: {
        tenantId: actor.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(flowId: string, actor: CurrentUserPayload) {
    const flow = await this.prisma.flow.findFirst({
      where: {
        id: flowId,
        tenantId: actor.tenantId,
      },
      include: {
        nodes: true,
        edges: true,
        variables: true,
        triggers: true,
      },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  async update(flowId: string, actor: CurrentUserPayload, dto: UpdateFlowDto) {
    await this.ensureFlow(flowId, actor.tenantId);

    const flow = await this.prisma.flow.update({
      where: { id: flowId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.metadata !== undefined
          ? { metadata: dto.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.audit.log(
      `Flow updated: ${flow.name}`,
      actor.tenantId,
      actor.userId,
      { flowId: flow.id },
    );

    return flow;
  }

  async remove(flowId: string, actor: CurrentUserPayload) {
    const flow = await this.ensureFlow(flowId, actor.tenantId);

    await this.prisma.flow.delete({
      where: { id: flowId },
    });

    await this.audit.log(
      `Flow deleted: ${flow.name}`,
      actor.tenantId,
      actor.userId,
      { flowId: flow.id },
    );

    return { message: 'Flow deleted successfully' };
  }

  async addNode(flowId: string, actor: CurrentUserPayload, dto: CreateFlowNodeDto) {
    await this.ensureFlow(flowId, actor.tenantId);

    const existingNode = await this.prisma.flowNode.findFirst({
      where: {
        flowId,
        key: dto.key,
      },
    });

    if (existingNode) {
      throw new BadRequestException('Node key already exists in this flow');
    }

    if (dto.isEntry) {
      await this.prisma.flowNode.updateMany({
        where: { flowId },
        data: { isEntry: false },
      });
    }

    return this.prisma.flowNode.create({
      data: {
        flowId,
        tenantId: actor.tenantId,
        type: dto.type,
        key: dto.key,
        label: dto.label,
        positionX: dto.positionX,
        positionY: dto.positionY,
        isEntry: dto.isEntry ?? false,
        ...(dto.config !== undefined
          ? { config: dto.config as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async updateNode(
    flowId: string,
    nodeId: string,
    actor: CurrentUserPayload,
    dto: UpdateFlowNodeDto,
  ) {
    await this.ensureFlow(flowId, actor.tenantId);
    await this.ensureNode(flowId, nodeId);

    if (dto.isEntry) {
      await this.prisma.flowNode.updateMany({
        where: { flowId },
        data: { isEntry: false },
      });
    }

    return this.prisma.flowNode.update({
      where: { id: nodeId },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.key !== undefined ? { key: dto.key } : {}),
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.positionX !== undefined ? { positionX: dto.positionX } : {}),
        ...(dto.positionY !== undefined ? { positionY: dto.positionY } : {}),
        ...(dto.isEntry !== undefined ? { isEntry: dto.isEntry } : {}),
        ...(dto.config !== undefined
          ? { config: dto.config as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async deleteNode(flowId: string, nodeId: string, actor: CurrentUserPayload) {
    await this.ensureFlow(flowId, actor.tenantId);
    await this.ensureNode(flowId, nodeId);

    await this.prisma.flowNode.delete({
      where: { id: nodeId },
    });

    return { message: 'Node deleted successfully' };
  }

  async addEdge(flowId: string, actor: CurrentUserPayload, dto: CreateFlowEdgeDto) {
    await this.ensureFlow(flowId, actor.tenantId);

    const sourceNode = await this.ensureNode(flowId, dto.sourceNodeId);
    const targetNode = await this.ensureNode(flowId, dto.targetNodeId);

    if (!sourceNode || !targetNode) {
      throw new BadRequestException('Invalid nodes');
    }

    return this.prisma.flowEdge.create({
      data: {
        flowId,
        sourceNodeId: dto.sourceNodeId,
        targetNodeId: dto.targetNodeId,
        label: dto.label,
        conditionKey: dto.conditionKey,
        ...(dto.metadata !== undefined
          ? { metadata: dto.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async deleteEdge(flowId: string, edgeId: string, actor: CurrentUserPayload) {
    await this.ensureFlow(flowId, actor.tenantId);

    const edge = await this.prisma.flowEdge.findFirst({
      where: {
        id: edgeId,
        flowId,
      },
    });

    if (!edge) {
      throw new NotFoundException('Edge not found');
    }

    await this.prisma.flowEdge.delete({
      where: { id: edgeId },
    });

    return { message: 'Edge deleted successfully' };
  }

  async addVariable(flowId: string, actor: CurrentUserPayload, dto: CreateFlowVariableDto) {
    await this.ensureFlow(flowId, actor.tenantId);

    return this.prisma.flowVariable.create({
      data: {
        flowId,
        tenantId: actor.tenantId,
        name: dto.name,
        type: dto.type,
        isRequired: dto.isRequired ?? false,
        description: dto.description,
        ...(dto.defaultValue !== undefined
          ? { defaultValue: dto.defaultValue as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async addTrigger(flowId: string, actor: CurrentUserPayload, dto: CreateFlowTriggerDto) {
    await this.ensureFlow(flowId, actor.tenantId);

    return this.prisma.flowTrigger.create({
      data: {
        flowId,
        tenantId: actor.tenantId,
        type: dto.type,
        isActive: dto.isActive ?? true,
        ...(dto.config !== undefined
          ? { config: dto.config as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async publish(flowId: string, actor: CurrentUserPayload) {
    const flow = await this.ensureFlow(flowId, actor.tenantId);

    const entryNode = await this.prisma.flowNode.findFirst({
      where: {
        flowId,
        isEntry: true,
      },
    });

    if (!entryNode) {
      throw new BadRequestException('Flow must have one entry node before publish');
    }

    const updated = await this.prisma.flow.update({
      where: { id: flowId },
      data: {
        status: FlowStatus.PUBLISHED,
        version: {
          increment: 1,
        },
      },
    });

    await this.audit.log(
      `Flow published: ${flow.name}`,
      actor.tenantId,
      actor.userId,
      { flowId: flow.id },
    );

    return updated;
  }

  private async ensureFlow(flowId: string, tenantId: string) {
    const flow = await this.prisma.flow.findFirst({
      where: {
        id: flowId,
        tenantId,
      },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  private async ensureNode(flowId: string, nodeId: string) {
    const node = await this.prisma.flowNode.findFirst({
      where: {
        id: nodeId,
        flowId,
      },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    return node;
  }
}