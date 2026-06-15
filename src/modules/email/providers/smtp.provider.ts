import { BadRequestException } from "@nestjs/common";

import nodemailer from "nodemailer";

import { ERROR_MESSAGES, TEST_EMAIL } from "../email.constants";

import type { IEmailProvider, SendEmailOptions, SmtpConfig, SmtpValidatePayload } from "../email-provider.interface";

export class SmtpProvider implements IEmailProvider {
  private readonly transporter: nodemailer.Transporter;

  private readonly fromEmail: string;

  constructor(config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
    this.fromEmail = config.fromEmail ?? "";
  }

  async validate(payload: Record<string, unknown>): Promise<void> {
    const { host, port, username, password, fromEmail, testEmail } = payload as unknown as SmtpValidatePayload;

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: true,
      auth: {
        user: username,
        pass: password,
      },
    });

    try {
      await transporter.verify();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(`${ERROR_MESSAGES.PROVIDER_VALIDATION_FAILED}: ${message}`);
    }

    try {
      await transporter.sendMail({
        from: (fromEmail ?? this.fromEmail) || TEST_EMAIL.FROM_MAIL,
        to: testEmail ?? TEST_EMAIL.TO_MAIL,
        subject: TEST_EMAIL.SUBJECT,
        html: TEST_EMAIL.CONTENT,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(`${ERROR_MESSAGES.TEST_EMAIL_FAILED}: ${message}`);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.fromEmail) {
      throw new BadRequestException(ERROR_MESSAGES.FROM_EMAIL_REQUIRED);
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(`${ERROR_MESSAGES.EMAIL_SEND_FAILED}: ${message}`);
    }
  }
}
