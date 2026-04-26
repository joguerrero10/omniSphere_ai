import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards
} from '@nestjs/common';
import { BotStatus } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { GetCompanyId } from '../../common/decorators/bots.decorators';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { BotsService } from './bots.service';
import { ChatBotDto } from './dto/chat-bot.dto';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';

interface User {
  userId: string;
  tenantId: string;
  roles: string[];
  companyId?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) { }

  // GET /bots → listar todos los bots de la empresa del usuario
  @Get()
  findAll(@GetCompanyId() companyId: string) {
    return this.botsService.findAll(companyId);
  }

  // GET /bots/:id → detalle de un bot
  @Get(':id')
  findOne(@Param('id') id: string, @GetCompanyId() companyId: string,) {
    return this.botsService.findOne(id, companyId);
  }

  // GET /bots/:id/stats → estadísticas del bot
  @Get(':id/stats')
  getStats(@Param('id') id: string, @GetCompanyId() companyId: string,) {
    return this.botsService.getStats(id, companyId);
  }

  // POST /bots → crear bot
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBotDto: CreateBotDto, @GetCompanyId() companyId: string,) {
    return this.botsService.create(companyId, createBotDto);
  }

  @Post(':id/chat')
  @HttpCode(HttpStatus.OK)
  chat(
    @Param('id') id: string,
    @Body() dto: ChatBotDto,
    @Req() req: ExpressRequest & { user: { tenantId: string } }
  ) {
    return this.botsService.chat(id, req.user.tenantId, dto);
  }
  // PUT /bots/:id → actualizar bot completo
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateBotDto: UpdateBotDto,
    @GetCompanyId() companyId: string,
  ) {
    return this.botsService.update(id, companyId, updateBotDto);
  }

  // PATCH /bots/:id/status → cambiar solo el estado
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BotStatus,
    @GetCompanyId() companyId: string,
  ) {
    return this.botsService.updateStatus(id, companyId, status);
  }

  // DELETE /bots/:id → eliminar bot
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @GetCompanyId() companyId: string,) {
    return this.botsService.remove(id, companyId);
  }
}