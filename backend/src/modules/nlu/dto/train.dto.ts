import { IsOptional, IsString } from 'class-validator';

export class TrainDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  createdBy?: string = 'system';

  @IsOptional()
  @IsString()
  triggerType?: string = 'manual';
}
