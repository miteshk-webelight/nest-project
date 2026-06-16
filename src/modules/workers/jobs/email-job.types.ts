export interface SendWelcomeEmailJob {
  userId: string;
  email: string;
  firstName: string;
}

export interface EmailJobPayloads {
  "send-welcome-email": SendWelcomeEmailJob;
}
