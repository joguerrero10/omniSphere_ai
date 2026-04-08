import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateWebhookEventDto } from './dto/create-webhook-event.dto';
import { RespondWebhookDto } from './dto/respond-webhook.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) { }

  @Post()
  createEvent(@Body() dto: CreateWebhookEventDto) {
    return this.webhooksService.createEvent(dto);
  }

  @Get()
  findAll(@Query('tenantId') tenantId: string) {
    return this.webhooksService.findAll(tenantId);
  }

  @Post('outbound')
  triggerOutbound(@Body() dto: CreateWebhookEventDto) {
    return this.webhooksService.triggerOutboundWebhook(dto);
  }

  @Post('inbound')
  receiveInbound(
    @Query('tenantId') tenantId: string,
    @Query('eventName') eventName: string,
    @Body() payload: Record<string, any>,
  ) {
    return this.webhooksService.receiveInboundWebhook(
      tenantId,
      eventName,
      payload,
    );
  }

  @Patch(':id/respond')
  respond(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: RespondWebhookDto,
  ) {
    return this.webhooksService.respond(id, tenantId, dto);
  }
}