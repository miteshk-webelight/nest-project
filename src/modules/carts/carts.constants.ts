export const GUEST_TOKEN_PREFIX = "guest";

export const CART_CACHE_TTL = 120;

export const CART_HEADER_GUEST_TOKEN = "x-guest-token";

export const ERROR_MESSAGES = {
  MISSING_GUEST_TOKEN: "Guest token header is required for guest requests.",
  INVALID_GUEST_TOKEN: "Invalid guest token.",
  CART_OWNER_MISMATCH: "Cart ownership does not match the current session.",
  PRODUCT_NOT_FOUND: "Product not found.",
  PRODUCT_NOT_APPROVED: "Product is not approved.",
  PRODUCT_INACTIVE: "Product is not active.",
  VENDOR_NOT_APPROVED: "Product vendor is not approved.",
  CATEGORY_INACTIVE: "Product category is not active.",
  QUANTITY_MINIMUM: "Quantity must be at least 1.",
  INSUFFICIENT_STOCK: "Requested quantity exceeds available stock.",
};

export const SUCCESS_MESSAGES = {
  ITEM_ADDED_TO_CART: "Item added to cart successfully.",
};

export const CART_SELECT_FIELDS = {
  CART: ["cart.id", "cart.userId", "cart.guestToken"],
  CART_ITEM: [
    "cartItem.id",
    "cartItem.cartId",
    "cartItem.productId",
    "cartItem.quantity",
    "cartItem.priceSnapshot",
    "cartItem.discountPriceSnapshot",
    "cartItem.slugSnapshot",
    "cartItem.nameSnapshot",
  ],
  PRODUCT: [
    "product.id",
    "product.name",
    "product.slug",
    "product.price",
    "product.discountPrice",
    "product.stock",
    "product.status",
    "product.isActive",
  ],
  VENDOR: ["vendor.id", "vendor.status"],
};
