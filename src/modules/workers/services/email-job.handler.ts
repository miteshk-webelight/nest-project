import { Injectable } from "@nestjs/common";

import { EmailService } from "../../email/email.service";
import { EmailTemplateRegistry } from "../../email/registries/email-template.registry";

import type { EmailJobPayload } from "../jobs/email-job.types";
import type { Job } from "bullmq";

@Injectable()
export class EmailJobHandler {
  constructor(
    private readonly emailService: EmailService,
    private readonly templateRegistry: EmailTemplateRegistry,
  ) {}

  async handle<T>(job: Job<EmailJobPayload<T>>): Promise<void> {
    const { type, email, data } = job.data;

    const template = this.templateRegistry.get<T>(type);

    const subject = template.subject(data);
    const html = template.html(data);

    await this.emailService.sendEmail({ to: email, subject, html });
  }
}
