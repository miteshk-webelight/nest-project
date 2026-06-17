export const OrderEvents = {
  ORDER_CREATED: "order.created",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_DELIVERED: "order.delivered",
  ORDER_CANCELLED_BY_VENDOR: "order.cancelled.vendor",
  ORDER_CANCELLED_BY_USER: "order.cancelled.user",
  ORDER_REFUNDED: "order.refunded",
} as const;

export type OrderCreatedPayload = {
  orderId: string;
  vendorId: string;
  vendorEmail: string;
  vendorName: string;
  customerName: string;
  totalAmount: string;
};

export type OrderConfirmedPayload = {
  orderId: string;
  userEmail: string;
  firstName: string;
  totalAmount: string;
};

export type OrderDeliveredPayload = {
  orderId: string;
  userEmail: string;
  firstName: string;
};

export type OrderCancelledByVendorPayload = {
  orderId: string;
  userEmail: string;
  firstName: string;
};

export type OrderCancelledByUserPayload = {
  orderId: string;
  userEmail: string;
  firstName: string;
};

export type OrderRefundedPayload = {
  orderId: string;
  amount: string;
  userEmail: string;
  firstName?: string;
  vendorEmail: string;
  vendorName?: string;
};
