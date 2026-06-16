import { Injectable, OnModuleDestroy } from "@nestjs/common";

import { Worker, type Job } from "bullmq";

import { workerConfig } from "src/config/worker.config";

import { logger } from "../../../services/logger.service";
import { QUEUE_NAMES } from "../queues/queue.constants";
import { EmailJobHandler } from "../services/email-job.handler";

@Injectable()
export class EmailProcessor implements OnModuleDestroy {
  private readonly worker: Worker;

  constructor(private readonly emailJobHandler: EmailJobHandler) {
    this.worker = new Worker(QUEUE_NAMES.EMAIL, async (job: Job) => this.emailJobHandler.handle(job), workerConfig);

    this.worker.on("failed", (job, err) => {
      logger.error(`Email job failed: jobId=${job?.id}, error=${err.message}`);
    });

    this.worker.on("completed", (job) => {
      logger.info(`Job Completed : jobId=${job.id}`);
    });

    logger.info("Email worker started");
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
    logger.info("Email worker stopped");
  }
}
