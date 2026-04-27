import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateBotRuleDto } from './dto/create-bot-rule.dto';
import { UpdateBotModeDto, UpdateBotRuleDto } from './dto/update-bot-rule.dto';

export interface RuleButton { id: string; title: string; }

export interface MatchResult {
  responseText: string;
  buttons: RuleButton[];
  isMenu: boolean;
}

const MENU_TRIGGERS = ['menu', 'menú', 'inicio', 'start', 'hola', 'hi', 'ayuda', 'help', '0'];

@Injectable()
export class BotRulesService {
  constructor(private prisma: PrismaService) { }

  async findAll(botId: string, tenantId: string) {
    await this.checkBotAccess(botId, tenantId);
    return this.prisma.botRule.findMany({
      where: { botId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(botId: string, tenantId: string, dto: CreateBotRuleDto) {
    await this.checkBotAccess(botId, tenantId);
    const buttons = (dto.buttons ?? []).map((b, i) => ({
      id: b.id || `btn_${Date.now()}_${i}`,
      title: b.title,
    }));

    return this.prisma.botRule.create({
      data: {
        botId,
        keywords: dto.keywords,
        menuOption: dto.menuOption,
        responseText: dto.responseText,
        buttons: buttons as Prisma.InputJsonValue,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(ruleId: string, botId: string, tenantId: string, dto: UpdateBotRuleDto) {
    await this.checkBotAccess(botId, tenantId);
    await this.findRule(ruleId, botId);
    const buttons = (dto.buttons ?? []).map((b, i) => ({
      id: b.id || `btn_${Date.now()}_${i}`,
      title: b.title,
    }));
    return this.prisma.botRule.update({
      where: { id: ruleId },
      data: {
        ...(dto.keywords !== undefined && { keywords: dto.keywords }),
        ...(dto.menuOption !== undefined && { menuOption: dto.menuOption }),
        ...(dto.responseText !== undefined && { responseText: dto.responseText }),
        ...(dto.buttons !== undefined && { buttons: buttons as Prisma.InputJsonValue, }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(ruleId: string, botId: string, tenantId: string) {
    await this.checkBotAccess(botId, tenantId);
    await this.findRule(ruleId, botId);
    await this.prisma.botRule.delete({ where: { id: ruleId } });
    return { message: 'Regla eliminada' };
  }

  async updateMode(botId: string, tenantId: string, dto: UpdateBotModeDto) {
    await this.checkBotAccess(botId, tenantId);
    return this.prisma.bot.update({
      where: { id: botId },
      data: {
        responseMode: dto.responseMode as any,
        ...(dto.mainMenuText !== undefined && { mainMenuText: dto.mainMenuText }),
      },
      select: { id: true, responseMode: true, mainMenuText: true },
    });
  }

  async resolveResponse(
    botId: string,
    userText: string,
    buttonId?: string,
  ): Promise<MatchResult | null> {
    const bot = await this.prisma.bot.findUnique({
      where: { id: botId },
      include: {
        rules: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!bot) return null;

    const normalized = userText.toLowerCase().trim();

    if (MENU_TRIGGERS.includes(normalized)) {
      return this.buildMainMenu(bot.rules, bot.mainMenuText ?? '¿En qué puedo ayudarte?');
    }


    if (buttonId) {
      const ruleIdFromBtn = buttonId.startsWith('rule_')
        ? buttonId.replace('rule_', '')
        : null;

      if (ruleIdFromBtn) {
        const btnMatch = bot.rules.find((r) => r.id === ruleIdFromBtn);
        if (btnMatch) {
          return {
            responseText: btnMatch.responseText,
            buttons: this.parseButtons(btnMatch.buttons),
            isMenu: false,
          };
        }
      }

      const menuOptionMatch = bot.rules.find(
        (r) => r.menuOption && r.menuOption.toLowerCase() === buttonId.toLowerCase(),
      );
      if (menuOptionMatch) {
        return {
          responseText: menuOptionMatch.responseText,
          buttons: this.parseButtons(menuOptionMatch.buttons),
          isMenu: false,
        };
      }
    }

    const menuMatch = bot.rules.find(
      (r) => r.menuOption && r.menuOption.toLowerCase() === normalized,
    );
    if (menuMatch) {
      return {
        responseText: menuMatch.responseText,
        buttons: this.parseButtons(menuMatch.buttons),
        isMenu: false,
      };
    }

    const keywordMatch = bot.rules.find((r) =>
      r.keywords.some((kw) => normalized.includes(kw.toLowerCase())),
    );
    if (keywordMatch) {
      return {
        responseText: keywordMatch.responseText,
        buttons: this.parseButtons(keywordMatch.buttons),
        isMenu: false,
      };
    }

    return null;
  }
  buildMainMenu(
    rules: { id: string; menuOption: string | null; sortOrder: number }[],
    menuText: string,
  ): MatchResult {
    const menuRules = rules.filter((r) => r.menuOption);

    const buttons: RuleButton[] = menuRules.slice(0, 10).map((r) => ({
      id: `rule_${r.id}`,                          // ID que llega de vuelta en el buttonId
      title: (r.menuOption ?? '').slice(0, 20),    // máx 20 chars en WhatsApp
    }));

    return { responseText: menuText, buttons, isMenu: true };
  }

  private parseButtons(raw: unknown): RuleButton[] {
    if (!Array.isArray(raw)) return [];
    return (raw as RuleButton[])
      .filter((b) => b && typeof b.id === 'string' && typeof b.title === 'string')
      .slice(0, 3);
  }

  private async checkBotAccess(botId: string, tenantId: string) {
    const bot = await this.prisma.bot.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Bot not found');
    if (bot.tenantId !== tenantId) throw new ForbiddenException('No tienes acceso a este bot');
    return bot;
  }

  private async findRule(ruleId: string, botId: string) {
    const rule = await this.prisma.botRule.findFirst({ where: { id: ruleId, botId } });
    if (!rule) throw new NotFoundException('Regla no encontrada');
    return rule;
  }
}