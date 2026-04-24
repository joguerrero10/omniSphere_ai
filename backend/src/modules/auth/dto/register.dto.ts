import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from "class-validator";

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8, {
    message: "Password must be at least 8 characters long",
  })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  password!: string;

  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters long" })
  @MaxLength(100)
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(2, { message: "Tenant name must be at least 2 characters long" })
  @MaxLength(100)
  @IsNotEmpty()
  tenantName!: string;
}


