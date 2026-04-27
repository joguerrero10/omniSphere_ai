import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from 'class-validator';

export class ButtonDto {
  @IsString() @IsNotEmpty() id!: string;
  @IsString() @IsNotEmpty() @MaxLength(20) title!: string;
}

export class CreateBotRuleDto {
  @IsArray()
  @IsString({ each: true })
  keywords!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(30)
  menuOption?: string;

  @IsString()
  @IsNotEmpty()
  responseText!: string;

  @IsOptional()
  @IsArray()
  buttons?: ButtonDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}