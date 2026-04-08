import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core/constants";
import { ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { CustomThrottlerGuard } from "./common/guards/custom-throttler.guard";
import { AppConfigModule } from "./config/config.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ChannelsModule } from "./modules/channels/channels.module";
import { FlowExecutionsModule } from './modules/flow-executions/flow-executions.module';
import { FlowsModule } from "./modules/flows/flows.module";
import { MetricsController } from './modules/nlu/metrics/metrics.controller';
import { NluModule } from "./modules/nlu/nlu.module";
import { TenantsModule } from "./modules/tenants/tenant.module";
import { UsersModule } from "./modules/users/users.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { QueueModule } from './queue.module';
import { RedisModule } from "./redis.module";


@Module({
  imports: [
    AppConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 20,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
        customProps: (req) => ({
          correlationId: req.correlationId,
        }),
      },
    }),
    AuthModule,
    TenantsModule,
    UsersModule,
    FlowsModule,
    FlowExecutionsModule,
    ChannelsModule,
    WebhooksModule,
    NluModule,
    RedisModule,
    QueueModule,
  ],
  controllers: [MetricsController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule { }
