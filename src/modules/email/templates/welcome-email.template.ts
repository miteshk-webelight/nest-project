/* eslint-disable @cspell/spellchecker */
export interface WelcomeEmailData {
  firstName?: string;
}

const BRAND_NAME = "E-commerce";
const SUPPORT_EMAIL = "support@ecomm.com";

export const welcomeEmailTemplate = {
  subject(firstName?: string) {
    return firstName ? `Welcome ${firstName}! Start Your Journey With Us` : "Welcome! Start Your Journey With Us";
  },

  html(data: WelcomeEmailData): string {
    return `
    <p>Hi ${data.firstName ?? ""},</p>

    <p>Welcome and thank you for joining us.</p>

    <p>Your account has been successfully created.</p>

    <p>Regards,<br />Team</p>
  `.trim();
  },
};
