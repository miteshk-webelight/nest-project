export const TOP_PRODUCTS_LIMIT = 10;

export const ANALYTICS_SELECT_FIELDS = {
  ORDERS: {
    TOTAL: "COUNT(order.id)",
    CONFIRMED: "SUM(CASE WHEN order.status = 'CONFIRMED' THEN 1 ELSE 0 END)",
    PENDING: "SUM(CASE WHEN order.status = 'PENDING' THEN 1 ELSE 0 END)",
    CANCELLED: "SUM(CASE WHEN order.status = 'CANCELLED' THEN 1 ELSE 0 END)",
  },

  VENDOR_ORDERS: {
    TOTAL: "COUNT(vendorOrder.id)",
    CONFIRMED: "SUM(CASE WHEN order.status = 'CONFIRMED' THEN 1 ELSE 0 END)",
    PENDING: "SUM(CASE WHEN order.status = 'PENDING' THEN 1 ELSE 0 END)",
    CANCELLED: "SUM(CASE WHEN order.status = 'CANCELLED' OR vendorOrder.status = 'CANCELLED' THEN 1 ELSE 0 END)",
  },

  USERS: {
    TOTAL: "COUNT(user.id)",
    VERIFIED: "SUM(CASE WHEN user.isEmailVerified = true THEN 1 ELSE 0 END)",
  },

  VENDORS: {
    TOTAL: "COUNT(vendor.id)",
    APPROVED: "SUM(CASE WHEN vendor.status = 'APPROVED' THEN 1 ELSE 0 END)",
    PENDING: "SUM(CASE WHEN vendor.status = 'PENDING' THEN 1 ELSE 0 END)",
    REJECTED: "SUM(CASE WHEN vendor.status = 'REJECTED' THEN 1 ELSE 0 END)",
  },

  PRODUCTS: {
    TOTAL: "COUNT(product.id)",
    APPROVED: "SUM(CASE WHEN product.status = 'APPROVED' THEN 1 ELSE 0 END)",
    PENDING: "SUM(CASE WHEN product.status = 'PENDING' THEN 1 ELSE 0 END)",
    SUSPENDED: "SUM(CASE WHEN product.status = 'SUSPENDED' THEN 1 ELSE 0 END)",
  },

  REVENUE: {
    TOTAL:
      "SUM(CASE WHEN order.paymentStatus = 'PAID' AND order.status != 'CANCELLED' THEN order.totalAmount ELSE 0 END)",
    REFUNDED: "SUM(CASE WHEN order.paymentStatus = 'REFUNDED' THEN order.totalAmount ELSE 0 END)",
    RAZORPAY:
      "SUM(CASE WHEN order.paymentStatus = 'PAID' AND order.paymentMethod = 'RAZORPAY' THEN order.totalAmount ELSE 0 END)",
    COD: "SUM(CASE WHEN order.paymentStatus = 'PAID' AND order.paymentMethod = 'COD' THEN order.totalAmount ELSE 0 END)",
  },

  VENDOR_REVENUE: {
    TOTAL:
      "SUM(CASE WHEN order.paymentStatus = 'PAID' AND order.status != 'CANCELLED' THEN vendorOrder.totalAmount ELSE 0 END)",
    REFUNDED: "SUM(CASE WHEN order.paymentStatus = 'REFUNDED' THEN vendorOrder.totalAmount ELSE 0 END)",
    RAZORPAY:
      "SUM(CASE WHEN order.paymentStatus = 'PAID' AND order.paymentMethod = 'RAZORPAY' THEN vendorOrder.totalAmount ELSE 0 END)",
    COD: "SUM(CASE WHEN order.paymentStatus = 'PAID' AND order.paymentMethod = 'COD' THEN vendorOrder.totalAmount ELSE 0 END)",
  },

  TOP_PRODUCTS: {
    SOLD_QUANTITY: "SUM(orderItem.quantity)",
  },
};
