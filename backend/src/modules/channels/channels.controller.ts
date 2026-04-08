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
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { SendChannelMessageDto } from './dto/send-channel-message.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  create(@Body() dto: CreateChannelDto) {
    return this.channelsService.create(dto);
  }

  @Get()
  findAll(@Query('tenantId') tenantId: string) {
    return this.channelsService.findAll(tenantId);
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

  @Post(':id/webhook')
  incomingWebhook(
    @Param('id') id: string,
    @Body() payload: Record<string, any>,
    @Headers() headers: Record<string, any>,
  ) {
    return this.channelsService.handleIncomingWebhook(id, payload, headers);
  }
}