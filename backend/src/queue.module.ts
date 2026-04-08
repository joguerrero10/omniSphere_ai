import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'nlu-jobs',
    }),
  ],
  exports: [BullModule],
})
export class QueueModule { }