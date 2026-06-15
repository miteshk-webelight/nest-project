/* eslint-disable @cspell/spellchecker */
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface ResendConfig {
  resendApiKey: string;
  fromEmail?: string;
}

export interface BrevoConfig {
  apiKey: string;
  fromEmail?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail?: string;
}

export interface TestEmailOptional {
  testEmail?: string;
}

export interface ResendValidatePayload extends ResendConfig, TestEmailOptional {}

export interface BrevoValidatePayload extends BrevoConfig, TestEmailOptional {}

export interface SmtpValidatePayload extends SmtpConfig, TestEmailOptional {}

export interface IEmailProvider {
  validate(payload: Record<string, unknown>): Promise<void>;

  sendEmail(options: SendEmailOptions): Promise<void>;
}
