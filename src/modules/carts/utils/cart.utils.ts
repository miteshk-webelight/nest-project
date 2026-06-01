import { ProductStatusEnum } from "src/modules/products/products.constants";
import { VendorStatusEnum } from "src/modules/vendors/vendors.constants";

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
      product.vendor.status === VendorStatusEnum.APPROVED &&
      product.category.isActive;

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
