import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { CurrentUserPayload } from "../../common/interfaces/current-user.interface";
import { CreateWebhookEventDto } from "./dto/create-webhook-event.dto";
import { RespondWebhookDto } from "./dto/respond-webhook.dto";
import { WebhooksService } from "./webhooks.service";

@UseGuards(JwtAuthGuard)
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) { }

  @Post()
  createEvent(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateWebhookEventDto,
  ) {
    return this.webhooksService.createEvent(actor.tenantId, dto);
  }

  @Get()
  findAll(@CurrentUser() actor: CurrentUserPayload) {
    return this.webhooksService.findAll(actor.tenantId);
  }

  @Post("outbound")
  triggerOutbound(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateWebhookEventDto,
  ) {
    return this.webhooksService.triggerOutboundWebhook(actor.tenantId, dto);
  }

  @Public()
  @Post("inbound/:channelId/:eventName")
  receiveInbound(
    @Param("channelId") channelId: string,
    @Param("eventName") eventName: string,
    @Body() payload: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Ip() sourceIp: string,
  ) {
    return this.webhooksService.receiveInboundWebhook(
      channelId,
      eventName,
      payload,
      headers,
      sourceIp,
    );
  }

  @Patch(":id/respond")
  respond(
    @Param("id") id: string,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: RespondWebhookDto,
  ) {
    return this.webhooksService.respond(id, actor.tenantId, dto);
  }
}