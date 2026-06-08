import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";
import { OrderItemEntity } from "../orders/entities/order-item.entity";
import { OrderEntity } from "../orders/entities/order.entity";
import { VendorOrderEntity } from "../orders/entities/vendor-order.entity";
import { ProductEntity } from "../products/product.entity";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";

import { ANALYTICS_SELECT_FIELDS, TOP_PRODUCTS_LIMIT } from "./analytics.constants";
import { AdminAnalyticsResponse } from "./responses/admin-analytics.response";
import { VendorAnalyticsResponse } from "./responses/vendor-analytics.response";
import { buildAdminAnalyticsResponse, buildVendorAnalyticsResponse } from "./utils/analytics-mapper.utils";

import type {
  AnalyticsScope,
  OrderAnalyticsRaw,
  ProductAnalyticsRaw,
  RevenueAnalyticsRaw,
  TopProductRaw,
  UserAnalyticsRaw,
  VendorCountAnalyticsRaw,
} from "./analytics.interface";

@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAdminAnalytics(): Promise<AdminAnalyticsResponse> {
    const [orderAnalytics, vendorAnalytics, userAnalytics, productAnalytics, revenueAnalytics] = await Promise.all([
      this.getOrderStatistics(),
      this.getVendorCountStatistics(),
      this.getUserStatistics(),
      this.getProductStatistics(),
      this.getRevenueStatistics(),
    ]);

    return buildAdminAnalyticsResponse({
      ...(orderAnalytics as OrderAnalyticsRaw),
      ...(vendorAnalytics as VendorCountAnalyticsRaw),
      ...(userAnalytics as UserAnalyticsRaw),
      ...(productAnalytics as ProductAnalyticsRaw),
      ...(revenueAnalytics as RevenueAnalyticsRaw),
    });
  }

  async getVendorAnalytics(vendorId: string): Promise<VendorAnalyticsResponse> {
    const scope: AnalyticsScope = { vendorId };

    const [productAnalytics, orderAnalytics, revenueAnalytics, topProducts] = await Promise.all([
      this.getProductStatistics(scope),
      this.getOrderStatistics(scope),
      this.getRevenueStatistics(scope),
      this.getTopProducts(vendorId),
    ]);

    return buildVendorAnalyticsResponse(
      productAnalytics as ProductAnalyticsRaw,
      orderAnalytics as OrderAnalyticsRaw,
      revenueAnalytics as RevenueAnalyticsRaw,
      topProducts,
    );
  }

  private getOrderStatistics(scope?: AnalyticsScope): Promise<OrderAnalyticsRaw | undefined> {
    if (scope?.vendorId) {
      return this.databaseService
        .getRepository(VendorOrderEntity)
        .createQueryBuilder("vendorOrder")
        .innerJoin("vendorOrder.order", "order")
        .select(ANALYTICS_SELECT_FIELDS.VENDOR_ORDERS.TOTAL, "totalOrders")
        .addSelect(ANALYTICS_SELECT_FIELDS.VENDOR_ORDERS.CONFIRMED, "confirmedOrders")
        .addSelect(ANALYTICS_SELECT_FIELDS.VENDOR_ORDERS.PENDING, "pendingOrders")
        .addSelect(ANALYTICS_SELECT_FIELDS.VENDOR_ORDERS.CANCELLED, "cancelledOrders")
        .where("vendorOrder.vendorId = :vendorId", { vendorId: scope.vendorId })
        .getRawOne();
    }

    return this.databaseService
      .getRepository(OrderEntity)
      .createQueryBuilder("order")
      .select(ANALYTICS_SELECT_FIELDS.ORDERS.TOTAL, "totalOrders")
      .addSelect(ANALYTICS_SELECT_FIELDS.ORDERS.CONFIRMED, "confirmedOrders")
      .addSelect(ANALYTICS_SELECT_FIELDS.ORDERS.PENDING, "pendingOrders")
      .addSelect(ANALYTICS_SELECT_FIELDS.ORDERS.CANCELLED, "cancelledOrders")
      .getRawOne();
  }

  private getVendorCountStatistics(): Promise<VendorCountAnalyticsRaw | undefined> {
    return this.databaseService
      .getRepository(VendorProfileEntity)
      .createQueryBuilder("vendor")
      .select(ANALYTICS_SELECT_FIELDS.VENDORS.TOTAL, "totalVendors")
      .addSelect(ANALYTICS_SELECT_FIELDS.VENDORS.APPROVED, "approvedVendors")
      .addSelect(ANALYTICS_SELECT_FIELDS.VENDORS.PENDING, "pendingVendors")
      .addSelect(ANALYTICS_SELECT_FIELDS.VENDORS.REJECTED, "rejectedVendors")
      .getRawOne();
  }

  private getUserStatistics(): Promise<UserAnalyticsRaw | undefined> {
    return this.databaseService
      .getRepository(UsersEntity)
      .createQueryBuilder("user")
      .select(ANALYTICS_SELECT_FIELDS.USERS.TOTAL, "totalUsers")
      .addSelect(ANALYTICS_SELECT_FIELDS.USERS.VERIFIED, "verifiedUsers")
      .getRawOne();
  }

  private getProductStatistics(scope?: AnalyticsScope): Promise<ProductAnalyticsRaw | undefined> {
    const qb = this.databaseService
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .select(ANALYTICS_SELECT_FIELDS.PRODUCTS.TOTAL, "totalProducts")
      .addSelect(ANALYTICS_SELECT_FIELDS.PRODUCTS.APPROVED, "approvedProducts")
      .addSelect(ANALYTICS_SELECT_FIELDS.PRODUCTS.PENDING, "pendingProducts")
      .addSelect(ANALYTICS_SELECT_FIELDS.PRODUCTS.SUSPENDED, "suspendedProducts");

    if (scope?.vendorId) {
      qb.where("product.vendorId = :vendorId", { vendorId: scope.vendorId });
    }

    return qb.getRawOne();
  }

  private getRevenueStatistics(scope?: AnalyticsScope): Promise<RevenueAnalyticsRaw | undefined> {
    if (scope?.vendorId) {
      return this.databaseService
        .getRepository(VendorOrderEntity)
        .createQueryBuilder("vendorOrder")
        .innerJoin("vendorOrder.order", "order")
        .select(ANALYTICS_SELECT_FIELDS.VENDOR_REVENUE.TOTAL, "totalRevenue")
        .addSelect(ANALYTICS_SELECT_FIELDS.VENDOR_REVENUE.REFUNDED, "refundedAmount")
        .addSelect(ANALYTICS_SELECT_FIELDS.VENDOR_REVENUE.RAZORPAY, "razorpayAmount")
        .addSelect(ANALYTICS_SELECT_FIELDS.VENDOR_REVENUE.COD, "cashOnDeliveryAmount")
        .where("vendorOrder.vendorId = :vendorId", { vendorId: scope.vendorId })
        .getRawOne();
    }

    return this.databaseService
      .getRepository(OrderEntity)
      .createQueryBuilder("order")
      .select(ANALYTICS_SELECT_FIELDS.REVENUE.TOTAL, "totalRevenue")
      .addSelect(ANALYTICS_SELECT_FIELDS.REVENUE.REFUNDED, "refundedAmount")
      .addSelect(ANALYTICS_SELECT_FIELDS.REVENUE.RAZORPAY, "razorpayAmount")
      .addSelect(ANALYTICS_SELECT_FIELDS.REVENUE.COD, "cashOnDeliveryAmount")
      .getRawOne();
  }

  private getTopProducts(vendorId: string): Promise<TopProductRaw[]> {
    return this.databaseService
      .getRepository(OrderItemEntity)
      .createQueryBuilder("orderItem")
      .innerJoin("orderItem.vendorOrder", "vendorOrder")
      .select("orderItem.productId", "productId")
      .addSelect("orderItem.nameSnapshot", "productName")
      .addSelect(ANALYTICS_SELECT_FIELDS.TOP_PRODUCTS.SOLD_QUANTITY, "soldQuantity")
      .where("vendorOrder.vendorId = :vendorId", { vendorId })
      .groupBy("orderItem.productId")
      .orderBy(ANALYTICS_SELECT_FIELDS.TOP_PRODUCTS.SOLD_QUANTITY, "DESC")
      .addGroupBy("orderItem.nameSnapshot")
      .limit(TOP_PRODUCTS_LIMIT)
      .getRawMany();
  }
}
