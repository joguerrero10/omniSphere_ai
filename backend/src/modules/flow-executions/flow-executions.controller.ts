import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ContinueFlowExecutionDto } from './dto/continue-flow-execution.dto';
import { ExecuteFlowDto } from './dto/execute-flow.dto';
import { FlowExecutionsService } from './flow-executions.service';

@UseGuards(JwtAuthGuard)
@Controller('flow-executions')
export class FlowExecutionsController {
  constructor(private readonly flowExecutionsService: FlowExecutionsService) { }

  @Post('execute')
  execute(@Body() dto: ExecuteFlowDto) {
    return this.flowExecutionsService.execute(dto);
  }

  @Post('continue')
  continue(@Body() dto: ContinueFlowExecutionDto) {
    return this.flowExecutionsService.continue(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flowExecutionsService.findOne(id);
  }

  @Get(':id/steps')
  findSteps(@Param('id') id: string) {
    return this.flowExecutionsService.findSteps(id);
  }

  @Get(':id/variables')
  findVariables(@Param('id') id: string) {
    return this.flowExecutionsService.findVariables(id);
  }
}