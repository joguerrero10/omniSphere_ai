import { PartialType } from '@nestjs/mapped-types';
import { CreateFlowNodeDto } from './create-flow-node.dto';

export class UpdateFlowNodeDto extends PartialType(CreateFlowNodeDto) { }