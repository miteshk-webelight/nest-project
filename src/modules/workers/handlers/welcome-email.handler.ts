import { Injectable, OnModuleInit } from "@nestjs/common";

import { EmailService } from "../../email/email.service";
import { welcomeEmailTemplate } from "../../email/templates/welcome-email.template";
import { EMAIL_JOB_NAMES } from "../queues/queue.constants";
import { EmailJobHandlerRegistry } from "../registry/email-job-handler.registry";

import type { EmailJobHandler } from "./email-job-handler.interface";
import type { SendWelcomeEmailJob } from "../jobs/email-job.types";
import type { Job } from "bullmq";

@Injectable()
export class WelcomeEmailHandler implements EmailJobHandler<SendWelcomeEmailJob>, OnModuleInit {
  readonly jobName = EMAIL_JOB_NAMES.SEND_WELCOME_EMAIL;

  constructor(
    private readonly emailService: EmailService,
    private readonly registry: EmailJobHandlerRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(job: Job<SendWelcomeEmailJob>): Promise<void> {
    const { email, firstName } = job.data;

    const subject = welcomeEmailTemplate.subject(firstName);
    const html = welcomeEmailTemplate.html({ firstName });

    await this.emailService.sendEmail({ to: email, subject, html });
  }
}
