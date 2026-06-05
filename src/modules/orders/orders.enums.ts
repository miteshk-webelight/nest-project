export enum OrderStatusEnum {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  STOCK_UNAVAILABLE = "STOCK_UNAVAILABLE",
}
export enum PaymentMethodEnum {
  RAZORPAY = "RAZORPAY",
  COD = "COD",
}
export enum PaymentStatusEnum {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}
export enum VendorOrderStatusEnum {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}
export enum OrderSortByEnum {
  CREATED_AT = "createdAt",
  PLACED_AT = "placedAt",
  TOTAL_AMOUNT = "totalAmount",
}
