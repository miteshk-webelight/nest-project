export const QUEUE_NAMES = {
  EMAIL: "email",
} as const;

export const EMAIL_JOB_NAMES = {
  SEND_WELCOME_EMAIL: "send-welcome-email",
} as const;

export const EMAIL_QUEUE_TOKEN = Symbol("EMAIL_QUEUE");
export const EMAIL_JOB_HANDLER_TOKEN = Symbol("EMAIL_JOB_HANDLER");
