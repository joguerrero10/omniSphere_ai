import { Test, TestingModule } from '@nestjs/testing';
import { FlowExecutionsController } from './flow-executions.controller';

describe('FlowExecutionsController', () => {
  let controller: FlowExecutionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlowExecutionsController],
    }).compile();

    controller = module.get<FlowExecutionsController>(FlowExecutionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
