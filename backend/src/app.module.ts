import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }