import { Injectable, OnModuleDestroy } from "@nestjs/common";

import { Worker, type Job } from "bullmq";

import { workerConfig } from "src/config/worker.config";

import { logger } from "../../../services/logger.service";
import { QUEUE_NAMES } from "../queues/queue.constants";
import { EmailJobHandlerRegistry } from "../registry/email-job-handler.registry";

@Injectable()
export class EmailProcessor implements OnModuleDestroy {
  private readonly worker: Worker;

  constructor(private readonly handlerRegistry: EmailJobHandlerRegistry) {
    this.worker = new Worker(QUEUE_NAMES.EMAIL, async (job: Job) => this.process(job), workerConfig);

    this.worker.on("failed", (job, err) => {
      logger.error(`Email job failed: jobId=${job?.id}, jobName=${job?.name}, error=${err.message}`);
    });

    this.worker.on("completed", (job) => {
      logger.info(`Job Completed : jobId=${job.id}, jobName=${job.name},`);
    });

    logger.info("Email worker started");
  }

  private async process(job: Job): Promise<void> {
    const handler = this.handlerRegistry.get(job.name);

    if (!handler) {
      throw new Error(`No handler registered for email job: ${job.name}`);
    }

    await handler.handle(job);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
    logger.info("Email worker stopped");
  }
}
