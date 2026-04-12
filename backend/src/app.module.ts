import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { CustomThrottlerGuard } from "./common/guards/custom-throttler.guard";
import { CorrelationIdInterceptor } from "./common/interceptor/correlation.id.interceptor";
import { AppConfigModule } from "./config/config.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ChannelsModule } from "./modules/channels/channels.module";
import { FlowExecutionsModule } from "./modules/flow-executions/flow-executions.module";
import { FlowsModule } from "./modules/flows/flows.module";
import { NluModule } from "./modules/nlu/nlu.module";
import { TenantsModule } from "./modules/tenants/tenant.module";
import { UsersModule } from "./modules/users/users.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { QueueModule } from "./queue.module";
import { RedisModule } from "./redis.module";

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 20,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty" }
            : undefined,
        customProps: (req) => ({
          correlationId: req.correlationId,
        }),
      },
    }),
    RedisModule,
    QueueModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    FlowsModule,
    FlowExecutionsModule,
    ChannelsModule,
    WebhooksModule,
    NluModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
  ],
})
export class AppModule { }