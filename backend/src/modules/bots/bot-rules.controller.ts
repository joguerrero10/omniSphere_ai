import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { GetCompanyId } from '../../common/decorators/bots.decorators';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { BotRulesService } from './bot-rules.service';
import { CreateBotRuleDto } from './dto/create-bot-rule.dto';
import { UpdateBotRuleDto } from './dto/update-bot-rule.dto';

@UseGuards(JwtAuthGuard)
@Controller('bots/:botId/rules')
export class BotRulesController {
  constructor(private readonly rulesService: BotRulesService) { }

  @Get()
  findAll(@Param('botId') botId: string, @GetCompanyId() tenantId: string) {
    return this.rulesService.findAll(botId, tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('botId') botId: string,
    @Body() dto: CreateBotRuleDto,
    @GetCompanyId() tenantId: string,
  ) {
    return this.rulesService.create(botId, tenantId, dto);
  }

  @Patch(':ruleId')
  update(
    @Param('botId') botId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateBotRuleDto,
    @GetCompanyId() tenantId: string,
  ) {
    return this.rulesService.update(ruleId, botId, tenantId, dto);
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('botId') botId: string,
    @Param('ruleId') ruleId: string,
    @GetCompanyId() tenantId: string,
  ) {
    return this.rulesService.remove(ruleId, botId, tenantId);
  }
}