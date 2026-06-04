export const ORDER_CACHE_TTL = 300;
export const RAZORPAY_HEADER_SIGNATURE_KEY = "x-razorpay-signature";

export const ERROR_MESSAGES = {
  ORDER_NOT_FOUND: "Order not found",
  ORDER_NOT_BELONG_TO_USER: "Order does not belong to current user",
  ADDRESS_NOT_FOUND: "Address not found",
  ADDRESS_NOT_BELONG_TO_USER: "Address does not belong to current user",
  CART_NOT_FOUND: "Cart not found",
  CART_EMPTY: "Cart is empty",
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_NOT_APPROVED: "Product is not approved",
  PRODUCT_INACTIVE: "Product is not active",
  VENDOR_NOT_APPROVED: "Vendor is not approved",
  INSUFFICIENT_STOCK: "Insufficient stock for product",
  ORDER_ALREADY_PAID: "Order is already paid",
  INVALID_ORDER_STATUS: "Invalid order status for this operation",
  WEBHOOK_SIGNATURE_INVALID: "Invalid webhook signature",
  WEBHOOK_AMOUNT_MISMATCH: "Webhook amount does not match order amount",
  WEBHOOK_SECRET_MISSING: "Webhook secret not configured",
  VENDOR_ORDER_MAPPING_FAILED: "Vendor order mapping failed",
  ORDER_CONTAINS_NO_ITEMS: "Order contains no items",
};

export const SUCCESS_MESSAGES = {
  CHECKOUT_SUCCESS: "Order created successfully",
  PAYMENT_INITIATED: "Payment initiated successfully",
  ORDER_CONFIRMED: "Order confirmed successfully",
  ORDER_CANCELLED: "Order cancelled successfully",
  WEBHOOK_PROCESSED: "Webhook processed successfully",
};

export const ORDER_SELECT_FIELDS = {
  CART_ITEM: [
    "cartItems.id",
    "cartItems.cartId",
    "cartItems.productId",
    "cartItems.quantity",
    "cartItems.priceSnapshot",
    "cartItems.discountPriceSnapshot",
    "cartItems.slugSnapshot",
    "cartItems.nameSnapshot",
  ],
  ORDER: [
    "order.id",
    "order.userId",
    "order.addressId",
    "order.orderNumber",
    "order.totalAmount",
    "order.paymentMethod",
    "order.paymentStatus",
    "order.razorpayOrderId",
    "order.razorpayPaymentId",
    "order.status",
    "order.placedAt",
    "order.createdAt",
    "order.updatedAt",
  ],
  ORDER_FOR_PAYMENT: [
    "order.id",
    "order.userId",
    "order.orderNumber",
    "order.totalAmount",
    "order.paymentMethod",
    "order.paymentStatus",
    "order.razorpayOrderId",
    "order.status",
  ],
  ORDER_FOR_WEBHOOK: [
    "order.id",
    "order.userId",
    "order.orderNumber",
    "order.totalAmount",
    "order.paymentStatus",
    "order.razorpayOrderId",
    "order.razorpayPaymentId",
    "order.status",
  ],
  VENDOR_ORDER: [
    "vendorOrder.id",
    "vendorOrder.orderId",
    "vendorOrder.vendorId",
    "vendorOrder.totalAmount",
    "vendorOrder.status",
    "vendorOrder.createdAt",
  ],
  ORDER_ITEM: [
    "orderItem.id",
    "orderItem.vendorOrderId",
    "orderItem.productId",
    "orderItem.quantity",
    "orderItem.unitPrice",
    "orderItem.totalPrice",
    "orderItem.skuSnapshot",
    "orderItem.nameSnapshot",
    "orderItem.slugSnapshot",
  ],
  PRODUCT: [
    "product.id",
    "product.vendorId",
    "product.name",
    "product.slug",
    "product.sku",
    "product.price",
    "product.discountPrice",
    "product.stock",
  ],
  VENDOR_ORDER_ID: ["vendorOrder.id"],
  ORDER_INFO: ["orderItem.id, orderItem.productId", "orderItem.quantity"],
  PRODUCT_INFO: ["product.id", "product.stock", "product.status", "product.isActive"],
};

export const PAYMENT_CURRENCY = {
  INR: "INR",
};

export const ORDER_ERROR_CONTEXT = {
  CHECKOUT: "Checkout",
  INITIATE_PAYMENT: "Initiate Payment",
  PROCESS_WEBHOOK: "Process Webhook",
  STOCK_DECREMENT: "Stock Decrement",
  REFUND_PAYMENT: "Refund Payment",
};

export const PAYMENT_STATUS_RAZORPAY = {
  CAPTURED: "payment.captured",
  FAILED: "payment.failed",
};
