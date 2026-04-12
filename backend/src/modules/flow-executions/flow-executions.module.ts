import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { FlowsModule } from '../flows/flows.module';
import { FlowExecutionRuntimeService } from './flow-execution-runtime.service';
import { FlowExecutionsController } from './flow-executions.controller';
import { FlowExecutionsService } from './flow-executions.service';
import { FlowVariableService } from './flow-variable.service';

@Module({
  imports: [CommonModule, FlowsModule],
  controllers: [FlowExecutionsController],
  providers: [
    FlowExecutionsService,
    FlowExecutionRuntimeService,
    FlowVariableService,
  ],
  exports: [
    FlowExecutionsService,
    FlowExecutionRuntimeService,
    FlowVariableService,
  ],
})
export class FlowExecutionsModule { }