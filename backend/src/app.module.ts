import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core/constants";
import { ThrottlerModule } from "@nestjs/throttler";
import { CustomThrottlerGuard } from "./common/guards/custom-throttler.guard";
import { AppConfigModule } from "./config/config.module";
import { AuthModule } from "./modules/auth/auth.module";
import { FlowExecutionsModule } from './modules/flow-executions/flow-executions.module';
import { FlowsModule } from "./modules/flows/flows.module";
import { TenantsModule } from "./modules/tenants/tenant.module";
import { UsersModule } from "./modules/users/users.module";

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
    AuthModule,
    TenantsModule,
    UsersModule,
    FlowsModule,
    FlowExecutionsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule { }
