import { buildEmailLayout } from "../builders/email-layout.builder";

export interface VendorOrderCreatedData {
  orderId: string;
  vendorName: string;
  customerName: string;
  totalAmount: string;
}

export interface OrderConfirmedData {
  orderId: string;
  firstName: string;
  totalAmount: string;
}

export interface OrderDeliveredData {
  orderId: string;
  firstName: string;
}

export interface OrderCancelledVendorData {
  orderId: string;
  firstName: string;
}

export interface OrderCancelledUserData {
  orderId: string;
  firstName: string;
}

export interface OrderRefundUserData {
  orderId: string;
  amount: string;
  firstName?: string;
}

export interface OrderRefundVendorData {
  orderId: string;
  amount: string;
  vendorName?: string;
}

export const orderEmailTemplates = {
  vendorOrderCreated: {
    subject(_data: VendorOrderCreatedData) {
      return "New Order Received";
    },

    html(data: VendorOrderCreatedData): string {
      const content = `
        <p>Hi ${data.vendorName},</p>

        <p>You have received a new order from ${data.customerName}.</p>

        <p><strong>Order ID:</strong> ${data.orderId}<br />
        <strong>Total Amount:</strong> ${data.totalAmount}</p>

        <p>Please log in to your dashboard to review and process this order.</p>
      `.trim();

      return buildEmailLayout({ title: "New Order", content });
    },
  },

  orderConfirmed: {
    subject(_data: OrderConfirmedData) {
      return "Order Confirmed";
    },

    html(data: OrderConfirmedData): string {
      const content = `
        <p>Hi ${data.firstName},</p>

        <p>Your order has been confirmed.</p>

        <p><strong>Order ID:</strong> ${data.orderId}<br />
        <strong>Total Amount:</strong> ${data.totalAmount}</p>

        <p>Thank you for your order.</p>
      `.trim();

      return buildEmailLayout({ title: "Order Confirmed", content });
    },
  },

  orderDelivered: {
    subject(_data: OrderDeliveredData) {
      return "Order Delivered";
    },

    html(data: OrderDeliveredData): string {
      const content = `
        <p>Hi ${data.firstName},</p>

        <p>Your order has been delivered.</p>

        <p><strong>Order ID:</strong> ${data.orderId}</p>

        <p>We hope you enjoy your purchase.</p>
      `.trim();

      return buildEmailLayout({ title: "Order Delivered", content });
    },
  },

  orderCancelledVendor: {
    subject(_data: OrderCancelledVendorData) {
      return "Order Cancelled";
    },

    html(data: OrderCancelledVendorData): string {
      const content = `
        <p>Hi ${data.firstName},</p>

        <p>Your order has been cancelled by the vendor.</p>

        <p><strong>Order ID:</strong> ${data.orderId}</p>

        <p>If you have any questions, please contact our support team.</p>
      `.trim();

      return buildEmailLayout({ title: "Order Cancelled", content });
    },
  },

  orderCancelledUser: {
    subject(_data: OrderCancelledUserData) {
      return "Order Cancelled";
    },

    html(data: OrderCancelledUserData): string {
      const content = `
        <p>Hi ${data.firstName},</p>

        <p>Your order has been cancelled as requested.</p>

        <p><strong>Order ID:</strong> ${data.orderId}</p>

        <p>If you have any questions, please contact our support team.</p>
      `.trim();

      return buildEmailLayout({ title: "Order Cancelled", content });
    },
  },

  refundUser: {
    subject(_data: OrderRefundUserData) {
      return "Refund Completed";
    },

    html(data: OrderRefundUserData): string {
      const greeting = data.firstName ? `Hi ${data.firstName},` : "Hi,";

      const content = `
        <p>${greeting}</p>

        <p>A refund has been processed for your order.</p>

        <p><strong>Order ID:</strong> ${data.orderId}<br />
        <strong>Refund Amount:</strong> ${data.amount}</p>

        <p>The amount will be credited to your original payment method.</p>
      `.trim();

      return buildEmailLayout({ title: "Refund Completed", content });
    },
  },

  refundVendor: {
    subject(_data: OrderRefundVendorData) {
      return "Refund Completed";
    },

    html(data: OrderRefundVendorData): string {
      const greeting = data.vendorName ? `Hi ${data.vendorName},` : "Hi,";

      const content = `
        <p>${greeting}</p>

        <p>A refund has been processed for an order.</p>

        <p><strong>Order ID:</strong> ${data.orderId}<br />
        <strong>Refund Amount:</strong> ${data.amount}</p>
      `.trim();

      return buildEmailLayout({ title: "Refund Completed", content });
    },
  },
};
