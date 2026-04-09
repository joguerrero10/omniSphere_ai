import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { SendChannelMessageDto } from './dto/send-channel-message.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  create(@Body() dto: CreateChannelDto) {
    return this.channelsService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() actor: CurrentUserPayload) {
    return this.channelsService.findAll(actor.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.channelsService.remove(id, tenantId);
  }

  @Post(':id/send')
  sendMessage(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: SendChannelMessageDto,
  ) {
    return this.channelsService.sendMessage(id, tenantId, dto);
  }

  @Public()
  @Post(':id/webhook')
  incomingWebhook(
    @Param('id') id: string,
    @Body() payload: Record<string, any>,
    @Headers() headers: Record<string, any>,
  ) {
    return this.channelsService.handleIncomingWebhook(id, payload, headers);
  }
}