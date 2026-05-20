import { SendEmailCommand, SESClient, type SendEmailCommandInput } from "@aws-sdk/client-ses";

import { appConfig } from "../config/app.config";

const sesClient = new SESClient({});

export const sendEmail = async (params: SendEmailCommandInput): Promise<boolean> => {
  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    // eslint-disable-next-line no-console
    console.log("Email sent:", result.MessageId);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendResetPasswordEmail = async (email: string, resetLink: string): Promise<boolean> => {
  const params: SendEmailCommandInput = {
    Source: appConfig.sourceEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Reset Your Account Password",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `<h1>Reset Your Account Password</h1>
          <p>Click the link below to reset your password:</p>
          <button style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">
          <a href="${resetLink}">Reset Password</a></button>
          <p>If the above button does not work, please copy and paste the following link into your browser:</p>
          <p>${resetLink}</p>`,
          Charset: "UTF-8",
        },
      },
    },
  };

  return sendEmail(params);
};

export const sendInvitationEmail = async (email: string, token: string): Promise<boolean> => {
  const params: SendEmailCommandInput = {
    Source: appConfig.sourceEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Invitation to join",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `<h1>Invitation to join</h1>
          <p>Click the link below to accept your invitation:</p>
          <button style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">
          <a href="${appConfig.frontendUrl}/accept-invitation?token=${token}">Accept Invitation</a></button>
          <p>If the above button does not work, please copy and paste the following link into your browser:</p>
          <p>${appConfig.frontendUrl}/accept-invitation?token=${token}</p>`,
          Charset: "UTF-8",
        },
      },
    },
  };

  return sendEmail(params);
};
export const sendOtpEmail = async (email: string, otp: string): Promise<boolean> => {
  const params: SendEmailCommandInput = {
    Source: appConfig.sourceEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "OTP to login",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `<h1>OTP to login</h1>
          <p>OTP: ${otp}</p>`,
          Charset: "UTF-8",
        },
      },
    },
  };

  return sendEmail(params);
};
