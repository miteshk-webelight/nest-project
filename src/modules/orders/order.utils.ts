import { BadRequestException } from "@nestjs/common";

import { ulid } from "ulid";

import { UserRoleEnum } from "../users/user.constants";

import { ERROR_MESSAGES, VALID_VENDOR_ORDER_STATUS_TRANSITION } from "./orders.constants";

import type { OrderItemEntity } from "./entities/order-item.entity";
import type { VendorOrderEntity } from "./entities/vendor-order.entity";
import type { VendorOrderStatusEnum } from "./orders.enums";
import type {
  CheckoutPricingSummary,
  GroupedCartItems,
  OrderUserSummary,
  OrderWithAddress,
  OrderAccessContext,
} from "./orders.interface";
import type { AdminOrderDetailsResponse, OrderDetailsResponse } from "./responses/order-details.response";
import type { RedisService } from "../redis/redis.service";
import type { OrderListItemResponse } from "./responses/order-list.response";
import type { CartItemEntity } from "../carts/entities/cart-items.entity";
import type { ProductEntity } from "../products/product.entity";
import type { AddressEntity } from "../users/entity/address.entity";

/**
 * Groups cart items by vendor based on the associated product.
 *
 * Used during checkout to create vendor-specific orders from a single cart.
 *
 * @param cartItems - Cart items to group.
 * @param productsMap - Product lookup map keyed by product ID.
 * @returns Array of vendor groups containing their cart items.
 */
export function groupCartItemsByVendor(
  cartItems: CartItemEntity[],
  productsMap: Map<string, ProductEntity>,
): GroupedCartItems[] {
  const vendorMap = new Map<string, CartItemEntity[]>();

  for (const cartItem of cartItems) {
    const product = productsMap.get(cartItem.productId)!;

    const vendorItems = vendorMap.get(product.vendorId) ?? [];

    vendorItems.push(cartItem);

    vendorMap.set(product.vendorId, vendorItems);
  }
  return [...vendorMap.entries()].map(([vendorId, vendorCartItems]) => ({
    vendorId,
    cartItems: vendorCartItems,
  }));
}

/**
 * Builds a complete pricing summary for the checkout flow.
 *
 * Calculates:
 * - Per-item pricing (unit price and total price)
 * - Vendor-level totals
 * - Overall order total
 *
 * @param groupedItems Cart items grouped by vendor.
 * @param productsMap Product lookup map keyed by product ID.
 *
 * @returns Aggregated checkout pricing summary containing:
 * - Order total
 * - Vendor totals
 * - Item pricing details
 */
export function calculateCheckoutPricing(
  groupedItems: GroupedCartItems[],
  productsMap: Map<string, ProductEntity>,
): CheckoutPricingSummary {
  let orderTotal = 0;

  const groups = groupedItems.map((group) => {
    let vendorTotal = 0;

    const items = group.cartItems.map((cartItem) => {
      const product = productsMap.get(cartItem.productId)!;

      const unitPrice = product.discountPrice ?? product.price;
      const totalPrice = unitPrice * cartItem.quantity;

      vendorTotal += totalPrice;

      return {
        cartItem,
        product,
        unitPrice,
        totalPrice,
      };
    });

    orderTotal += vendorTotal;

    return {
      vendorId: group.vendorId,
      totalAmount: vendorTotal,
      items,
    };
  });

  return {
    totalAmount: orderTotal,
    groups,
  };
}

export function generateOrderNumber(): string {
  const ulidSuffix = ulid().slice(-8);
  return `ORD-${ulidSuffix}`;
}

/* eslint-disable @cspell/spellchecker */
export function convertToPaise(amount: number): number {
  return Math.round(amount * 100);
}

export function convertFromPaise(amount: number): number {
  return amount / 100;
}

export function formatAddress(address: AddressEntity): string {
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}

function mapCoreOrderFields(order: OrderWithAddress): Omit<OrderListItemResponse, "createdAt"> {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    placedAt: order.placedAt ?? new Date(),
    address: {
      fullName: order.address.fullName,
      phoneNumber: order.address.phoneNumber,
      address: formatAddress(order.address),
    },
  };
}

export const buildOrderListResponse = (orders: OrderWithAddress[]): OrderListItemResponse[] => {
  return orders.map((order) => {
    return {
      ...mapCoreOrderFields(order),
      createdAt: order.createdAt,
    };
  });
};

export const buildOrderDetailsResponse = (
  order: OrderWithAddress,
  vendorOrders: VendorOrderEntity[],
): OrderDetailsResponse => {
  return {
    ...mapCoreOrderFields(order),
    vendorOrders: vendorOrders.map((vendorOrder) => ({
      id: vendorOrder.id,
      vendorId: vendorOrder.vendorId,
      vendorBusinessName: vendorOrder.vendor.businessName,
      status: vendorOrder.status,
      totalAmount: vendorOrder.totalAmount,
      items: vendorOrder.orderItems.map((item: OrderItemEntity) => ({
        productId: item.productId,
        nameSnapshot: item.nameSnapshot,
        slugSnapshot: item.slugSnapshot,
        skuSnapshot: item.skuSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    })),
  };
};

export const buildAdminOrderDetailsResponse = (
  order: OrderWithAddress,
  user: OrderUserSummary,
  vendorOrders: VendorOrderEntity[],
): AdminOrderDetailsResponse => {
  return {
    ...buildOrderDetailsResponse(order, vendorOrders),
    user,
    razorpay: {
      razorpayOrderId: order.razorpayOrderId ?? null,
      razorpayPaymentId: order.razorpayPaymentId ?? null,
    },
  };
};

export const getOrderAccessScopeKey = (access: OrderAccessContext): string => {
  if (access.role === UserRoleEnum.ADMIN) {
    return "admin:all";
  }

  if (access.role === UserRoleEnum.VENDOR) {
    return `vendor:${access.vendorId}`;
  }

  return `user:${access.userId}`;
};

export const getOrderListCacheKey = (scopeKey: string, params: string): string => {
  return `order:list:${scopeKey}:${params}`;
};

export const getOrderDetailsCacheKey = (orderId: string, scopeKey: string): string => {
  return `order:details:${orderId}:${scopeKey}`;
};

export const invalidateCache = async (
  redisService: RedisService,
  orderId?: string | null,
  userId?: string | null,
  vendorId?: string | null,
): Promise<void> => {
  const keysToDelete: string[] = [];

  if (orderId) {
    const detailKeys = await redisService.keys(`order:details:${orderId}:*`);
    keysToDelete.push(...detailKeys);
  }

  if (userId) {
    const listKeys = await redisService.keys(`order:list:user:${userId}:*`);
    keysToDelete.push(...listKeys);
  }

  if (vendorId) {
    const listKeys = await redisService.keys(`order:list:vendor:${vendorId}:*`);
    keysToDelete.push(...listKeys);
  }

  const adminListKeys = await redisService.keys("order:list:admin:all:*");
  keysToDelete.push(...adminListKeys);

  if (keysToDelete.length > 0) {
    await redisService.delete(keysToDelete);
  }
};

export const validateVendorOrderStatusTransition = (
  currentStatus: VendorOrderStatusEnum,
  nextStatus: VendorOrderStatusEnum,
): void => {
  if (currentStatus === nextStatus) {
    throw new BadRequestException(ERROR_MESSAGES.ORDER_STATUS_ALREADY_SET);
  }

  const allowedTransitions = VALID_VENDOR_ORDER_STATUS_TRANSITION[currentStatus];

  if (!allowedTransitions.includes(nextStatus)) {
    throw new BadRequestException(ERROR_MESSAGES.INVALID_VENDOR_ORDER_STATUS_TRANSITION(currentStatus, nextStatus));
  }
};
