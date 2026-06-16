import { Inject, Injectable } from "@nestjs/common";

import { EMAIL_JOB_NAMES, EMAIL_QUEUE_TOKEN } from "../queues/queue.constants";

import type { SendWelcomeEmailJob } from "../jobs/email-job.types";
import type { Queue } from "bullmq";

@Injectable()
export class EmailQueueService {
  constructor(
    @Inject(EMAIL_QUEUE_TOKEN)
    private readonly emailQueue: Queue,
  ) {}

  async addWelcomeEmailJob(data: SendWelcomeEmailJob): Promise<void> {
    await this.emailQueue.add(EMAIL_JOB_NAMES.SEND_WELCOME_EMAIL, data);
  }
}
