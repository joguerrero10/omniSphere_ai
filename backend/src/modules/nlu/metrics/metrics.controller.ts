import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';
import { MetricsService } from './metrics.service';

@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) { }

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.metrics();
  }
}
