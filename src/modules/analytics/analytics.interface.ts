export interface AnalyticsScope {
  vendorId?: string;
}

export interface OrderAnalyticsRaw {
  totalOrders: string | null;
  confirmedOrders: string | null;
  pendingOrders: string | null;
  cancelledOrders: string | null;
}

export interface UserAnalyticsRaw {
  totalUsers: string | null;
  verifiedUsers: string | null;
}

export interface VendorCountAnalyticsRaw {
  totalVendors: string | null;
  approvedVendors: string | null;
  pendingVendors: string | null;
  rejectedVendors: string | null;
}

export interface ProductAnalyticsRaw {
  totalProducts: string | null;
  approvedProducts: string | null;
  pendingProducts: string | null;
  suspendedProducts: string | null;
}

export interface RevenueAnalyticsRaw {
  totalRevenue: string | null;
  refundedAmount: string | null;
  razorpayAmount: string | null;
  cashOnDeliveryAmount: string | null;
}
export interface TopProductRaw {
  productId: string;
  productName: string;
  soldQuantity: string | null;
}

export interface AdminAnalyticsRaw
  extends OrderAnalyticsRaw, UserAnalyticsRaw, VendorCountAnalyticsRaw, ProductAnalyticsRaw, RevenueAnalyticsRaw {}
