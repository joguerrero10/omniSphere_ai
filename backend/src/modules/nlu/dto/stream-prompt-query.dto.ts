import { IsString, MaxLength, MinLength } from "class-validator";

export class StreamPromptQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  prompt!: string;
}