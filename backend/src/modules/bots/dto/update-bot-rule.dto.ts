import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateBotRuleDto } from './create-bot-rule.dto';
export class UpdateBotRuleDto extends PartialType(CreateBotRuleDto) { }
export enum BotResponseMode { AI = 'AI', PREDEFINED = 'PREDEFINED' }

export class UpdateBotModeDto {
  @IsEnum(BotResponseMode)
  responseMode!: BotResponseMode;

  @IsOptional()
  @IsString()
  mainMenuText?: string;
}