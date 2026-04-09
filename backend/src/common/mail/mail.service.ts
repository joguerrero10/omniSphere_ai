import { MailerService } from "@nestjs-modules/mailer";
import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  async sendUserInvitationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL");

    if (!frontendUrl) {
      throw new InternalServerErrorException(
        "FRONTEND_URL is not configured",
      );
    }

    const invitationUrl = `${frontendUrl.replace(/\/$/, "")}/accept-invitation?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: "Invitación a la plataforma",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Has sido invitado a la plataforma</h2>
          <p>Haz clic en el siguiente botón para completar tu registro:</p>
          <p>
            <a
              href="${invitationUrl}"
              style="
                display:inline-block;
                padding:10px 16px;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                border-radius:6px;
              "
            >
              Aceptar invitación
            </a>
          </p>
          <p>Si el botón no funciona, usa este enlace:</p>
          <p>${invitationUrl}</p>
          <p>Este enlace expirará en 24 horas.</p>
        </div>
      `,
    });
  }
}