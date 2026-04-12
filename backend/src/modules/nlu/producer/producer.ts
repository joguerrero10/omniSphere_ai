import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class NluJobProducer {
  constructor(@InjectQueue('nlu-jobs') private readonly queue: Queue) { }

  async enqueueEmbeddingJob(payload: {
    documentId: string;
    text: string;
    userId: string;
  }) {
    await this.queue.add('generate-embedding', payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }
}