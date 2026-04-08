import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FeedbackDto {
  @IsString()
  tenantId: string;

  @IsString()
  inferenceLogId: string;

  @IsBoolean()
  wasCorrect: boolean;

  @IsOptional()
  @IsString()
  correctIntentId?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
