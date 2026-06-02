import { ProductStatusEnum } from "src/modules/products/products.constants";
import { VendorStatusEnum } from "src/modules/vendors/vendors.constants";

import type { MergeInstruction } from "../carts.types";
import type { CartItemEntity } from "../entities/cart-items.entity";
import type { CartEntity } from "../entities/carts.entity";
import type { CartItemResponse } from "../response/cart-item.response";
import type { CartResponse } from "../response/cart.response";
import type { ProductEntity } from "src/modules/products/product.entity";

export const getCartTotalItems = (items: CartItemResponse[]): number =>
  items.reduce((total, item) => total + item.quantity, 0);

export const getCartSubtotal = (items: CartItemResponse[]): number =>
  Number(
    items
      .reduce((subtotal, item) => subtotal + item.quantity * (item.discountPriceSnapshot ?? item.priceSnapshot), 0)
      .toFixed(2),
  );

export const buildCartResponse = (cartId: string | null, items: CartItemResponse[]): CartResponse => ({
  cartId: cartId ?? undefined,
  items,
  totalItems: getCartTotalItems(items),
  subtotal: getCartSubtotal(items),
});

export const mapCartToResponse = (cart: CartEntity): CartResponse => {
  const items: CartItemResponse[] = cart.cartItems.map((item) => {
    const product = item.product as ProductEntity | undefined;
    const isAvailable =
      !!product &&
      product.status === ProductStatusEnum.APPROVED &&
      product.isActive &&
      product.vendor.status === VendorStatusEnum.APPROVED;

    return {
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot: Number(item.priceSnapshot),
      discountPriceSnapshot: item.discountPriceSnapshot ? Number(item.discountPriceSnapshot) : undefined,
      slugSnapshot: item.slugSnapshot,
      nameSnapshot: item.nameSnapshot,
      isAvailable,
      isOutOfStock: !!product && product.stock <= 0,
    };
  });

  return buildCartResponse(cart.id, items);
};

export const buildMergeInstructions = (
  userItems: CartItemEntity[],
  guestItems: CartItemEntity[],
  availableProducts: ProductEntity[],
): MergeInstruction[] => {
  const productById = new Map(availableProducts.map((p) => [p.id, p]));
  const userItemByProductId = new Map(userItems.map((item) => [item.productId, item]));
  const instructions: MergeInstruction[] = [];

  for (const guestItem of guestItems) {
    const product = productById.get(guestItem.productId);

    // If product is unavailable, skip it
    if (!product) continue;

    const userItem = userItemByProductId.get(guestItem.productId);
    const mergedQuantity = (userItem?.quantity ?? 0) + guestItem.quantity;

    // Cap merged quantity to currently available stock.
    const finalQuantity = Math.min(Number(product.stock), mergedQuantity);

    if (userItem) {
      if (finalQuantity <= 0) {
        instructions.push({ action: "DELETE_USER_ITEM", itemId: userItem.id });
      } else {
        instructions.push({ action: "UPDATE_USER_ITEM", itemId: userItem.id, finalQuantity });
      }
    } else if (finalQuantity > 0) {
      instructions.push({ action: "MIGRATE_GUEST_ITEM", itemId: guestItem.id, finalQuantity });
    }
  }

  return instructions;
};
