import { Test, TestingModule } from '@nestjs/testing';
import { FlowExecutionsService } from './flow-executions.service';

describe('FlowExecutionsService', () => {
  let service: FlowExecutionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlowExecutionsService],
    }).compile();

    service = module.get<FlowExecutionsService>(FlowExecutionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
