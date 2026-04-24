import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

/**
 * DTO para cambio de contraseña
 */
export class ChangePasswordDto {
    @IsString()
    @MinLength(1)
    @IsNotEmpty()
    currentPassword!: string;
  
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    })
    newPassword!: string;
  
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    confirmPassword!: string;
  }
  