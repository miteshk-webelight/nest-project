import { BadRequestException } from "@nestjs/common";

import { Resend } from "resend";

import { ERROR_MESSAGES, TEST_EMAIL } from "../email.constants";

import type {
  IEmailProvider,
  ResendConfig,
  ResendValidatePayload,
  SendEmailOptions,
} from "../email-provider.interface";

export class ResendProvider implements IEmailProvider {
  private readonly client: Resend;

  private readonly fromEmail: string;

  constructor(config: ResendConfig) {
    this.client = new Resend(config.resendApiKey);
    this.fromEmail = config.fromEmail ?? TEST_EMAIL.FROM_MAIL;
  }

  async validate(payload: Record<string, unknown>): Promise<void> {
    const { resendApiKey, fromEmail, testEmail } = payload as unknown as ResendValidatePayload;

    const client = new Resend(resendApiKey);

    const { error } = await client.emails.send({
      from: (fromEmail ?? this.fromEmail) || TEST_EMAIL.FROM_MAIL,
      to: testEmail ?? TEST_EMAIL.TO_MAIL,
      subject: TEST_EMAIL.SUBJECT,
      html: TEST_EMAIL.CONTENT,
    });

    if (error) {
      throw new BadRequestException(`${ERROR_MESSAGES.PROVIDER_VALIDATION_FAILED}: ${error.message}`);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.fromEmail) {
      throw new BadRequestException(ERROR_MESSAGES.FROM_EMAIL_REQUIRED);
    }

    const { error } = await this.client.emails.send({
      from: this.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      throw new BadRequestException(`${ERROR_MESSAGES.EMAIL_SEND_FAILED}: ${error.message}`);
    }
  }
}
