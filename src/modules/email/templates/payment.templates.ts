import { buildEmailLayout } from "../builders/email-layout.builder";

export interface PaymentSuccessData {
  orderId: string;
  paymentMethod: string;
  amount: string;
  paymentStatus: string;
  dateTime: string;
}

export interface PaymentFailedData {
  orderId: string;
  paymentMethod: string;
  amount: string;
  paymentStatus: string;
  dateTime: string;
}

export const paymentEmailTemplates = {
  success: {
    subject(_data: PaymentSuccessData) {
      return "Payment Successful";
    },

    html(data: PaymentSuccessData): string {
      const content = `
        <p>Hi,</p>

        <p>Your payment has been successfully processed.</p>

        <p><strong>Order ID:</strong> ${data.orderId}<br />
        <strong>Payment Method:</strong> ${data.paymentMethod}<br />
        <strong>Total Amount:</strong> ${data.amount}<br />
        <strong>Payment Status:</strong> ${data.paymentStatus}<br />
        <strong>Date/Time:</strong> ${data.dateTime}</p>

        <p>Thank you for your purchase.</p>
      `.trim();

      return buildEmailLayout({ title: "Payment Successful", content });
    },
  },

  failed: {
    subject(_data: PaymentFailedData) {
      return "Payment Failed";
    },

    html(data: PaymentFailedData): string {
      const content = `
        <p>Hi,</p>

        <p>Unfortunately, your payment could not be processed.</p>

        <p><strong>Order ID:</strong> ${data.orderId}<br />
        <strong>Payment Method:</strong> ${data.paymentMethod}<br />
        <strong>Total Amount:</strong> ${data.amount}<br />
        <strong>Payment Status:</strong> ${data.paymentStatus}<br />
        <strong>Date/Time:</strong> ${data.dateTime}</p>

        <p>Please try again or use a different payment method.</p>
      `.trim();

      return buildEmailLayout({ title: "Payment Failed", content });
    },
  },
};
