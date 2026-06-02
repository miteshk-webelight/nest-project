import { CART_CACHE_TTL, ERROR_MESSAGES } from "../carts.constants";

import type { CartCacheKeyParams, ClearCartCacheParams, GetCachedCartParams } from "../carts.types";

export const getUserCartCacheKey = (userId: string): string => `cart:user:${userId}`;
export const getGuestCartCacheKey = (guestToken: string): string => `cart:guest:${guestToken}`;

export const getCartCacheKey = ({ userId, guestToken }: CartCacheKeyParams): string => {
  if (userId) {
    return getUserCartCacheKey(userId);
  }

  if (guestToken) {
    return getGuestCartCacheKey(guestToken);
  }

  throw new Error(ERROR_MESSAGES.CART_OWNER_MISMATCH);
};

export async function getCachedCart<T>({
  redisService,
  userId,
  guestToken,
  fetcher,
}: GetCachedCartParams<T>): Promise<T> {
  const key = getCartCacheKey({ userId, guestToken });

  return redisService.getOrSet<T>({
    key,
    ttl: CART_CACHE_TTL,
    fetcher,
  });
}

export async function clearCartCache({ redisService, userId, guestToken }: ClearCartCacheParams): Promise<void> {
  const key = getCartCacheKey({ userId, guestToken });

  await redisService.delete([key]);
}
