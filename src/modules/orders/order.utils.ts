import { ulid } from "ulid";

import type { OrderItemEntity } from "./entities/order-item.entity";
import type {
  CheckoutPricingSummary,
  GroupedCartItems,
  OrderWithAddress,
  VendorOrderWithVendor,
} from "./orders.interface";
import type { OrderDetailsResponse } from "./responses/order-details.response";
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
  vendorOrders: VendorOrderWithVendor[],
): OrderDetailsResponse => {
  return {
    ...mapCoreOrderFields(order),
    vendorOrders: vendorOrders.map((vendorOrder) => ({
      id: vendorOrder.id,
      vendorId: vendorOrder.vendorId,
      vendorBusinessName: vendorOrder.businessName,
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

export const getOrderListCacheKey = (userId: string, params: string): string => {
  return `order:list:${userId}:${params}`;
};

export const getOrderDetailsCacheKey = (orderId: string): string => {
  return `order:details:${orderId}`;
};
