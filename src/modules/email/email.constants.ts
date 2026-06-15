import { appConfig } from "src/config/app.config";

/* eslint-disable @cspell/spellchecker */
export const EMAIL_CACHE_TTL = 86400; // 1 Day Cache Expriy for Email Provider
export const EMAIL_CACHE_KEY = "email:provider:active";

export const ERROR_MESSAGES = {
  PROVIDER_NOT_FOUND: "No email provider configured",
  PROVIDER_ALREADY_EXISTS: "Email provider already configured",
  INVALID_PROVIDER: "Invalid email provider",
  PROVIDER_VALIDATION_FAILED: "Email provider validation failed",
  TEST_EMAIL_FAILED: "Test email could not be sent",
  TEST_EMAIL_REQUIRED: "Test email is required for provider validation",
  FROM_EMAIL_REQUIRED: "From email is required to send emails",
  EMAIL_SEND_FAILED: "Failed to send email",
};

export const SUCCESS_MESSAGES = {
  PROVIDER_CONFIGURED: "Email provider configured successfully",
};

export const PROVIDER_SELECT_FIELDS = {
  BASIC: ["provider.id", "provider.provider", "provider.encryptedConfig", "provider.isActive"],
  STATUS: ["provider.id", "provider.provider", "provider.isActive"],
};

export enum EmailProviderEnum {
  RESEND = "RESEND",
  BREVO = "BREVO",
  SMTP = "SMTP",
}

export const TEST_EMAIL = {
  FROM_MAIL: appConfig.testEmail.from,
  TO_MAIL: appConfig.testEmail.to,
  SUBJECT: "Test Email - Configuration",
  CONTENT: "<p>This is a test email to verify your email provider configuration.</p>",
};

export const PROVIDER_CONFIG_FIELDS: Record<EmailProviderEnum, string[]> = {
  [EmailProviderEnum.RESEND]: ["resendApiKey"],
  [EmailProviderEnum.BREVO]: ["apiKey"],
  [EmailProviderEnum.SMTP]: ["host", "port", "username", "password"],
};
