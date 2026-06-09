import type {
  AdminAnalyticsRaw,
  OrderAnalyticsRaw,
  ProductAnalyticsRaw,
  RevenueAnalyticsRaw,
  TopProductRaw,
  UserAnalyticsRaw,
  VendorCountAnalyticsRaw,
} from "../analytics.interface";
import type { AdminAnalyticsResponse } from "../responses/admin-analytics.response";
import type {
  OrderReport,
  ProductReport,
  RevenueReport,
  UserReport,
  VendorReport,
} from "../responses/analytics-reports.response";
import type { VendorAnalyticsResponse } from "../responses/vendor-analytics.response";

export const toNumber = (value: string | number | null | undefined): number => Number(value ?? 0);

export const buildOrderReport = (data: OrderAnalyticsRaw): OrderReport => ({
  totalOrders: toNumber(data.totalOrders),
  confirmedOrders: toNumber(data.confirmedOrders),
  pendingOrders: toNumber(data.pendingOrders),
  cancelledOrders: toNumber(data.cancelledOrders),
});

export const buildProductReport = (data: ProductAnalyticsRaw): ProductReport => ({
  totalProducts: toNumber(data.totalProducts),
  approvedProducts: toNumber(data.approvedProducts),
  pendingProducts: toNumber(data.pendingProducts),
  suspendedProducts: toNumber(data.suspendedProducts),
});

export const buildRevenueReport = (data: RevenueAnalyticsRaw): RevenueReport => ({
  totalRevenue: toNumber(data.totalRevenue),
  refundedAmount: toNumber(data.refundedAmount),
  razorpayAmount: toNumber(data.razorpayAmount),
  cashOnDeliveryAmount: toNumber(data.cashOnDeliveryAmount),
});

export const buildUserReport = (data: UserAnalyticsRaw): UserReport => ({
  totalUsers: toNumber(data.totalUsers),
  verifiedUsers: toNumber(data.verifiedUsers),
});

export const buildVendorCountReport = (data: VendorCountAnalyticsRaw): VendorReport => ({
  totalVendors: toNumber(data.totalVendors),
  approvedVendors: toNumber(data.approvedVendors),
  pendingVendors: toNumber(data.pendingVendors),
  rejectedVendors: toNumber(data.rejectedVendors),
});

export const buildAdminAnalyticsResponse = (data: AdminAnalyticsRaw): AdminAnalyticsResponse => ({
  users: buildUserReport(data),
  vendors: buildVendorCountReport(data),
  products: buildProductReport(data),
  orders: buildOrderReport(data),
  revenue: buildRevenueReport(data),
});

export const buildVendorAnalyticsResponse = (
  productData: ProductAnalyticsRaw,
  orderData: OrderAnalyticsRaw,
  revenueData: RevenueAnalyticsRaw,
  topProducts: TopProductRaw[],
): VendorAnalyticsResponse => ({
  products: buildProductReport(productData),
  orders: buildOrderReport(orderData),
  revenue: buildRevenueReport(revenueData),
  topProducts: topProducts.map((product) => ({
    productId: product.productId,
    productName: product.productName,
    soldQuantity: toNumber(product.soldQuantity),
  })),
});
