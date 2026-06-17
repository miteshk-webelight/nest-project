export const EMAIL_TYPES = {
  AUTH_WELCOME: "auth.welcome",

  VENDOR_REGISTRATION_ADMIN: "vendor.registration.admin",
  VENDOR_REGISTRATION_RECEIVED: "vendor.registration.received",
  VENDOR_APPROVED: "vendor.approved",
  VENDOR_REJECTED: "vendor.rejected",
  VENDOR_SUSPENDED: "vendor.suspended",
  VENDOR_DELETED: "vendor.deleted",

  PRODUCT_SUBMITTED_ADMIN: "product.submitted.admin",
  PRODUCT_APPROVED: "product.approved",
  PRODUCT_REJECTED: "product.rejected",

  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",

  ORDER_CREATED_VENDOR: "order.created.vendor",
  ORDER_CONFIRMED_USER: "order.confirmed.user",
  ORDER_DELIVERED_USER: "order.delivered.user",
  ORDER_CANCELLED_VENDOR: "order.cancelled.vendor",
  ORDER_CANCELLED_USER: "order.cancelled.user",
  ORDER_REFUNDED_USER: "order.refunded.user",
  ORDER_REFUNDED_VENDOR: "order.refunded.vendor",
} as const;
