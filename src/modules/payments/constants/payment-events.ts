export const PaymentEvents = {
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
} as const;

export type PaymentCompletedPayload = {
  orderId: string;
  userId: string;
  userEmail: string;
  firstName: string;
  amount: string;
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string;
};

export type PaymentFailedPayload = {
  orderId: string;
  userId: string;
  userEmail: string;
  firstName: string;
  amount: string;
  paymentMethod: string;
  paymentStatus: string;
  failedAt: string;
};

export const PAYMENT_EVENT_EMAIL_TYPE_MAP: Record<string, string> = {
  [PaymentEvents.PAYMENT_COMPLETED]: "payment.success",
  [PaymentEvents.PAYMENT_FAILED]: "payment.failed",
};
