import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('nlu-jobs')
export class NluJobProcessor extends WorkerHost {
  private readonly logger = new Logger(NluJobProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'generate-embedding':
        this.logger.log(`Procesando embedding para ${job.data.documentId}`);
        return { ok: true };

      default:
        throw new Error(`Job no soportado: ${job.name}`);
    }
  }
}