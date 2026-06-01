import { CART_CACHE_TTL, ERROR_MESSAGES } from "../carts.constants";

import type { RedisService } from "../../redis/redis.service";

export const getUserCartCacheKey = (userId: string): string => `cart:user:${userId}`;
export const getGuestCartCacheKey = (guestToken: string): string => `cart:guest:${guestToken}`;

export const getCartCacheKey = ({ userId, guestToken }: { userId?: string; guestToken?: string }): string => {
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
}: {
  redisService: RedisService;
  userId?: string;
  guestToken?: string;
  fetcher: () => Promise<T>;
}): Promise<T> {
  const key = getCartCacheKey({ userId, guestToken });

  return redisService.getOrSet<T>({
    key,
    ttl: CART_CACHE_TTL,
    fetcher,
  });
}

export async function clearCartCache({
  redisService,
  userId,
  guestToken,
}: {
  redisService: RedisService;
  userId?: string;
  guestToken?: string;
}): Promise<void> {
  const key = getCartCacheKey({ userId, guestToken });

  await redisService.delete([key]);
}
