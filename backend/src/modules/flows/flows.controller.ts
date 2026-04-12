import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { CreateFlowEdgeDto } from "./dto/create-flow-edge.dto";
import { CreateFlowNodeDto } from "./dto/create-flow-node.dto";
import { CreateFlowTriggerDto } from "./dto/create-flow-trigger.dto";
import { CreateFlowVariableDto } from "./dto/create-flow-variable.dto";
import { CreateFlowDto } from "./dto/create-flow.dto";
import { UpdateFlowNodeDto } from "./dto/update-flow-node.dto";
import { UpdateFlowDto } from "./dto/update-flow.dto";
import { FlowsService } from "./flows.service";

@UseGuards(JwtAuthGuard)
@Controller("flows")
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) { }

  @Post()
  create(@CurrentUser() actor: CurrentUserPayload, @Body() dto: CreateFlowDto) {
    return this.flowsService.create(actor, dto);
  }

  @Get()
  findAll(@CurrentUser() actor: CurrentUserPayload) {
    return this.flowsService.findAll(actor);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.flowsService.findOne(id, actor);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: UpdateFlowDto,
  ) {
    return this.flowsService.update(id, actor, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.flowsService.remove(id, actor);
  }

  @Post(":id/nodes")
  addNode(
    @Param("id") flowId: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateFlowNodeDto,
  ) {
    return this.flowsService.addNode(flowId, actor, dto);
  }

  @Patch(":id/nodes/:nodeId")
  updateNode(
    @Param("id") flowId: string,
    @Param("nodeId") nodeId: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: UpdateFlowNodeDto,
  ) {
    return this.flowsService.updateNode(flowId, nodeId, actor, dto);
  }

  @Delete(":id/nodes/:nodeId")
  deleteNode(
    @Param("id") flowId: string,
    @Param("nodeId") nodeId: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.flowsService.deleteNode(flowId, nodeId, actor);
  }

  @Post(":id/edges")
  addEdge(
    @Param("id") flowId: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateFlowEdgeDto,
  ) {
    return this.flowsService.addEdge(flowId, actor, dto);
  }

  @Delete(":id/edges/:edgeId")
  deleteEdge(
    @Param("id") flowId: string,
    @Param("edgeId") edgeId: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.flowsService.deleteEdge(flowId, edgeId, actor);
  }

  @Post(":id/variables")
  addVariable(
    @Param("id") flowId: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateFlowVariableDto,
  ) {
    return this.flowsService.addVariable(flowId, actor, dto);
  }

  @Post(":id/triggers")
  addTrigger(
    @Param("id") flowId: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateFlowTriggerDto,
  ) {
    return this.flowsService.addTrigger(flowId, actor, dto);
  }

  @Post(":id/publish")
  publish(
    @Param("id") flowId: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.flowsService.publish(flowId, actor);
  }
}
