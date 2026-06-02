import type { RedisService } from "../redis/redis.service";
import type { UsersEntity } from "../users/entity/users.entity";

export type CartOwner = {
  user?: UsersEntity;
  guestToken?: string;
};

export interface CartCacheKeyParams {
  userId?: string;
  guestToken?: string;
}

export interface GetCachedCartParams<T> extends CartCacheKeyParams {
  redisService: RedisService;
  fetcher: () => Promise<T>;
}

export interface ClearCartCacheParams extends CartCacheKeyParams {
  redisService: RedisService;
}
