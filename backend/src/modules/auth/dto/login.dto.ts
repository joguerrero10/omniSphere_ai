import { IsEmail, IsString, MinLength, IsNotEmpty } from "class-validator";

/**
 * DTO para login
 */
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  password!: string;
}

