import { Inject, Injectable } from "@nestjs/common";

import { EMAIL_QUEUE_TOKEN } from "../queues/queue.constants";

import type { EmailJobPayload } from "../jobs/email-job.types";
import type { Queue } from "bullmq";

const EMAIL_JOB_NAME = "email";

@Injectable()
export class EmailQueueService {
  constructor(
    @Inject(EMAIL_QUEUE_TOKEN)
    private readonly emailQueue: Queue,
  ) {}

  async addEmailJob<T>(payload: EmailJobPayload<T>): Promise<void> {
    await this.emailQueue.add(EMAIL_JOB_NAME, payload);
  }
}
