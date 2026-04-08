import { IsOptional, IsString } from 'class-validator';

export class CreateUtteranceDto {
  @IsString()
  intentId: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  language?: string = 'es';

  @IsOptional()
  @IsString()
  source?: string = 'manual';

  @IsOptional()
  @IsString()
  createdBy?: string;
}
