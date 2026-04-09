import { IsEnum, IsOptional, IsString } from "class-validator";

export enum NluTrainTrigger {
  MANUAL = "manual",
  AUTO = "auto",
}

export class TrainDto {
  @IsOptional()
  @IsString()
  createdBy?: string = "system";

  @IsOptional()
  @IsEnum(NluTrainTrigger)
  triggerType?: NluTrainTrigger = NluTrainTrigger.MANUAL;
}