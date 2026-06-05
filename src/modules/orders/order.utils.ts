import { ulid } from "ulid";

import type { CheckoutPricingSummary, GroupedCartItems } from "./orders.interface";
import type { CartItemEntity } from "../carts/entities/cart-items.entity";
import type { ProductEntity } from "../products/product.entity";

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
