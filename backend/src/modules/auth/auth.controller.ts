import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "../../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }


  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`Register attempt for email: ${dto.email}`);
    return this.authService.register(dto);
  }


  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);
    return this.authService.login(dto);
  }


  @UseGuards(AuthGuard("jwt"))
  @Post("profile")
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: any) {
    return {
      user: {
        id: req.user.userId,
        tenantId: req.user.tenantId,
        roles: req.user.roles,
      },
    };
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user.userId;
    this.logger.log(`Password change attempt for user: ${userId}`);
    return this.authService.changePassword(userId, dto);
  }


  @UseGuards(AuthGuard("jwt"))
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const userId = req.user.userId;
    this.logger.log(`User logged out: ${userId}`);
    return {
      message: "Logged out successfully",
    };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: { refresh_token: string }) {
    this.logger.log(`Refresh token attempt`);
    return this.authService.refreshToken(dto.refresh_token);
  }
}