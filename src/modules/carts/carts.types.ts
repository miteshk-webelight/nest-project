import type { AddCartItemDto } from "./dto/add-cart-item.dto";
import type { RedisService } from "../redis/redis.service";
import type { CartItemEntity } from "./entities/cart-items.entity";
import type { CartEntity } from "./entities/carts.entity";
import type { UsersEntity } from "../users/entity/users.entity";
import type { QueryRunner } from "typeorm";

export type CartOwner = {
  user?: UsersEntity;
  guestToken?: string;
};

export interface CartCacheKeyParams {
  userId?: string;
  guestToken?: string;
}

export interface QueryRunnerParams {
  queryRunner: QueryRunner;
}

export interface QueryRunnerParamsOptional {
  queryRunner?: QueryRunner;
}
export interface ProductIdParams {
  productId: string;
}

export interface CartIdParams {
  cartId: string;
}

export interface CartIdentityParams {
  user?: UsersEntity;
  guestToken?: string;
}

export interface GetCachedCartParams<T> extends CartCacheKeyParams {
  redisService: RedisService;
  fetcher: () => Promise<T>;
}

export interface ClearCartCacheParams extends CartCacheKeyParams {
  redisService: RedisService;
}

export interface FindCartByOwnerParams extends QueryRunnerParamsOptional, CartCacheKeyParams {
  includeItems?: boolean;
}

export interface FindCartItemsParams extends QueryRunnerParams, CartIdParams {}

export interface FindCartItemParams extends QueryRunnerParams, CartIdParams, ProductIdParams {}

export interface FindOrCreateCartParams extends QueryRunnerParams, CartCacheKeyParams {}

export interface GetAvailableProductParams extends QueryRunnerParams, ProductIdParams {}

export interface FindAvailableProductsByIdsParams extends QueryRunnerParams {
  productIds: string[];
}

export interface ConvertGuestCartToUserParams extends QueryRunnerParams, CartIdParams {
  userId: string;
}

export interface MergeCartItemsParams extends QueryRunnerParams {
  userCartId: string;
  userItems: CartItemEntity[];
  guestItems: CartItemEntity[];
}

export interface GetCartItemOrFailParams extends QueryRunnerParams, ProductIdParams, CartCacheKeyParams {}

export interface AddCartItemParams extends CartIdentityParams {
  dto: AddCartItemDto;
}

export interface UpdateCartItemParams extends CartIdentityParams, ProductIdParams {
  quantity: number;
}

export interface RemoveCartItemParams extends CartIdentityParams, ProductIdParams {}

export type GetCurrentCartParams = CartIdentityParams;

export interface MergeGuestCartToUserParams {
  userId: string;
  guestToken?: string;
  isNewUser: boolean;
}

export interface CartItemLookupResult {
  cart: CartEntity;
  cartItem: CartItemEntity;
}

export interface MergeInstruction {
  action: "UPDATE_USER_ITEM" | "DELETE_USER_ITEM" | "MIGRATE_GUEST_ITEM";
  itemId: string;
  finalQuantity?: number;
  userCartId?: string;
}
