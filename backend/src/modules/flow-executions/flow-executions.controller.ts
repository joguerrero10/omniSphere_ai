import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { ContinueFlowExecutionDto } from "./dto/continue-flow-execution.dto";
import { ExecuteFlowDto } from "./dto/execute-flow.dto";
import { FlowExecutionsService } from "./flow-executions.service";

@UseGuards(JwtAuthGuard)
@Controller("flow-executions")
export class FlowExecutionsController {
  constructor(private readonly flowExecutionsService: FlowExecutionsService) { }

  @Post("execute")
  execute(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: ExecuteFlowDto,
  ) {
    return this.flowExecutionsService.execute(actor.tenantId, dto);
  }

  @Post("continue")
  continueExecution(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: ContinueFlowExecutionDto,
  ) {
    return this.flowExecutionsService.continueExecution(actor.tenantId, dto);
  }

  @Get(":id")
  findOne(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    return this.flowExecutionsService.findOne(id, actor.tenantId);
  }

  @Get(":id/steps")
  findSteps(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    return this.flowExecutionsService.findSteps(id, actor.tenantId);
  }

  @Get(":id/variables")
  findVariables(
    @CurrentUser() actor: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    return this.flowExecutionsService.findVariables(id, actor.tenantId);
  }
}