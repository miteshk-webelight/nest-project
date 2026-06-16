import { buildEmailLayout } from "../builders/email-layout.builder";

export interface AuthWelcomeData {
  firstName?: string;
}

export const authEmailTemplates = {
  welcome: {
    subject(data: AuthWelcomeData) {
      return data.firstName
        ? `Welcome ${data.firstName}! Start Your Journey With Us`
        : "Welcome! Start Your Journey With Us";
    },

    html(data: AuthWelcomeData): string {
      const content = `
        <p>Hi ${data.firstName ?? ""},</p>

        <p>Welcome and thank you for joining us.</p>

        <p>Your account has been successfully created.</p>
      `.trim();

      return buildEmailLayout({ title: "Welcome Aboard", content });
    },
  },
};
