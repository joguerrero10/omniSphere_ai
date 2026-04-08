import { IsString } from 'class-validator';

export class ClassifyDto {
  @IsString()
  text: string;
}