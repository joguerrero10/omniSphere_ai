import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri({ scheme: [/postgres/, /postgresql/] }).required(),
        JWT_SECRET: Joi.string().min(32).required(),
        PORT: Joi.number().port().default(3000),
        CORS_ORIGIN: Joi.string().required(),

        REDIS_HOST: Joi.string().default("localhost"),
        REDIS_PORT: Joi.number().port().default(6379),
        REDIS_PASSWORD: Joi.string().allow("").optional(),

        FRONTEND_URL: Joi.string().uri().required(),

        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.number().port().default(587),
        MAIL_USER: Joi.string().required(),
        MAIL_PASS: Joi.string().required(),
        MAIL_FROM: Joi.string().email().required(),

        DEFAULT_LLM_PROVIDER: Joi.string()
          .valid("openai", "groq", "anthropic")
          .default("groq"),
        DEFAULT_LLM_MODEL: Joi.string().default("llama3-8b-8192"),

        OPENAI_API_KEY: Joi.string().allow("").optional(),
        GROQ_API_KEY: Joi.string().allow("").optional(),
        ANTHROPIC_API_KEY: Joi.string().allow("").optional(),

        NODE_ENV: Joi.string()
          .valid("development", "test", "production")
          .default("development"),
      }),
    }),
  ],
})
export class AppConfigModule { }