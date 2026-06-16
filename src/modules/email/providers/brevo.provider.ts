/* eslint-disable @cspell/spellchecker */
import { BadRequestException } from "@nestjs/common";

import { BrevoClient } from "@getbrevo/brevo";

import { ERROR_MESSAGES, TEST_EMAIL } from "../email.constants";

import type { BrevoConfig, BrevoValidatePayload, IEmailProvider, SendEmailOptions } from "../email-provider.interface";

export class BrevoProvider implements IEmailProvider {
  private readonly client: BrevoClient;

  private readonly fromEmail: string;

  constructor(config: BrevoConfig) {
    this.client = new BrevoClient({
      apiKey: config.apiKey,
    });
    this.fromEmail = config.fromEmail ?? TEST_EMAIL.FROM_MAIL;
  }

  async validate(payload: Record<string, unknown>): Promise<void> {
    const { apiKey, fromEmail, testEmail } = payload as unknown as BrevoValidatePayload;

    const client = new BrevoClient({
      apiKey,
    });

    try {
      await client.transactionalEmails.sendTransacEmail({
        sender: { email: (fromEmail ?? this.fromEmail) || TEST_EMAIL.FROM_MAIL },
        to: [{ email: testEmail ?? TEST_EMAIL.TO_MAIL }],
        subject: TEST_EMAIL.SUBJECT,
        htmlContent: TEST_EMAIL.CONTENT,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(`${ERROR_MESSAGES.PROVIDER_VALIDATION_FAILED}: ${message}`);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.fromEmail) {
      throw new BadRequestException(ERROR_MESSAGES.FROM_EMAIL_REQUIRED);
    }

    try {
      await this.client.transactionalEmails.sendTransacEmail({
        htmlContent: options.html,
        sender: { email: this.fromEmail },
        subject: options.subject,
        to: [{ email: options.to }],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(`${ERROR_MESSAGES.EMAIL_SEND_FAILED}: ${message}`);
    }
  }
}
