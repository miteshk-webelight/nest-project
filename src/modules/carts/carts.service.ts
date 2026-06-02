import { Injectable, NotFoundException } from "@nestjs/common";

import { QueryRunner } from "typeorm";
import { ulid } from "ulid";

import { DatabaseService } from "../database/database.service";
import { ProductEntity } from "../products/product.entity";
import { ProductStatusEnum } from "../products/products.constants";
import { RedisService } from "../redis/redis.service";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { GUEST_TOKEN_PREFIX, CART_SELECT_FIELDS, ERROR_MESSAGES } from "./carts.constants";
import {
  AddCartItemParams,
  CartItemLookupResult,
  CartOwner,
  ConvertGuestCartToUserParams,
  FindAvailableProductsByIdsParams,
  FindCartByOwnerParams,
  FindCartItemParams,
  FindCartItemsParams,
  FindOrCreateCartParams,
  GetAvailableProductParams,
  GetCartItemOrFailParams,
  GetCurrentCartParams,
  MergeCartItemsParams,
  MergeGuestCartToUserParams,
  RemoveCartItemParams,
  UpdateCartItemParams,
} from "./carts.types";
import { CartItemEntity } from "./entities/cart-items.entity";
import { CartEntity } from "./entities/carts.entity";
import { CartResponse } from "./response/cart.response";
import { clearCartCache, getCachedCart } from "./utils/cart-cache.utils";
import { resolveCartOwner, validateStock, validateGuestToken } from "./utils/cart-validation.utils";
import { buildCartResponse, buildMergeInstructions, mapCartToResponse } from "./utils/cart.utils";

@Injectable()
export class CartsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  generateGuestToken(): { guestToken: string } {
    return {
      guestToken: `${GUEST_TOKEN_PREFIX}_${ulid()}`,
    };
  }

  async addCartItem({ dto, guestToken, user }: AddCartItemParams): Promise<void> {
    const cartOwner = resolveCartOwner({ user, guestToken });

    await this.databaseService.executeTransaction({
      errorContext: "Add Cart Item",
      operation: async (queryRunner: QueryRunner) => {
        const cart = await this.findOrCreateCart({
          queryRunner,
          userId: cartOwner.userId,
          guestToken: cartOwner.guestToken,
        });

        const product = await this.getAvailableProduct({
          queryRunner,
          productId: dto.productId,
        });

        validateStock({ requestedQuantity: dto.quantity, stock: product.stock });

        const existingCartItem = await this.findCartItem({
          queryRunner,
          cartId: cart.id,
          productId: dto.productId,
        });

        if (existingCartItem) {
          const newQuantity = existingCartItem.quantity + dto.quantity;

          validateStock({ requestedQuantity: newQuantity, stock: product.stock });

          await queryRunner.manager
            .createQueryBuilder()
            .update(CartItemEntity)
            .set({ quantity: newQuantity })
            .where("id = :id", { id: existingCartItem.id })
            .execute();
        } else {
          const cartItem = queryRunner.manager.create(CartItemEntity, {
            cartId: cart.id,
            productId: dto.productId,
            quantity: dto.quantity,
            priceSnapshot: product.price,
            discountPriceSnapshot: product.discountPrice,
            slugSnapshot: product.slug,
            nameSnapshot: product.name,
          });

          await queryRunner.manager.save(cartItem);
        }
      },
    });

    await clearCartCache({
      redisService: this.redisService,
      userId: cartOwner.userId,
      guestToken: cartOwner.guestToken,
    });
  }

  async updateCartItem({ productId, quantity, guestToken, user }: UpdateCartItemParams): Promise<void> {
    const cartOwner = resolveCartOwner({ user, guestToken });

    await this.databaseService.executeTransaction({
      errorContext: "Update Cart Item",
      operation: async (queryRunner: QueryRunner) => {
        const { cartItem } = await this.getCartItemOrFail({
          queryRunner,
          productId,
          userId: cartOwner.userId,
          guestToken: cartOwner.guestToken,
        });

        if (quantity <= 0) {
          await queryRunner.manager.delete(CartItemEntity, {
            id: cartItem.id,
          });

          return;
        }

        const product = await this.getAvailableProduct({
          queryRunner,
          productId,
        });

        validateStock({
          requestedQuantity: quantity,
          stock: product.stock,
        });

        await queryRunner.manager.update(CartItemEntity, { id: cartItem.id }, { quantity });
      },
    });

    await clearCartCache({
      redisService: this.redisService,
      userId: cartOwner.userId,
      guestToken: cartOwner.guestToken,
    });
  }

  async removeCartItem({ productId, guestToken, user }: RemoveCartItemParams): Promise<void> {
    const cartOwner = resolveCartOwner({ user, guestToken });

    await this.databaseService.executeTransaction({
      errorContext: "Remove Cart Item",
      operation: async (queryRunner: QueryRunner) => {
        const { cartItem } = await this.getCartItemOrFail({
          queryRunner,
          productId,
          userId: cartOwner.userId,
          guestToken: cartOwner.guestToken,
        });

        await queryRunner.manager.delete(CartItemEntity, {
          id: cartItem.id,
        });
      },
    });

    await clearCartCache({
      redisService: this.redisService,
      userId: cartOwner.userId,
      guestToken: cartOwner.guestToken,
    });
  }

  async getCurrentCart({ guestToken, user }: GetCurrentCartParams): Promise<CartResponse> {
    if (!user && !guestToken) {
      return buildCartResponse(null, []);
    }

    const cartOwner: CartOwner = user ? { user } : { guestToken: validateGuestToken(guestToken) };

    return getCachedCart<CartResponse>({
      redisService: this.redisService,
      userId: cartOwner.user?.id,
      guestToken: cartOwner.guestToken,
      fetcher: async () => {
        const cart = await this.findCartByOwner({
          userId: cartOwner.user?.id,
          guestToken: cartOwner.guestToken,
          includeItems: true,
        });

        if (!cart) {
          return buildCartResponse(null, []);
        }

        return mapCartToResponse(cart);
      },
    });
  }

  async mergeGuestCartToUser({ userId, guestToken, isNewUser }: MergeGuestCartToUserParams): Promise<void> {
    if (!guestToken) {
      return;
    }

    const validatedGuestToken = validateGuestToken(guestToken);

    const shouldClearCache = await this.databaseService.executeTransaction({
      errorContext: "Merge Guest Cart To User",
      operation: async (queryRunner: QueryRunner) => {
        const guestCart = await this.findCartByOwner({
          queryRunner,
          guestToken: validatedGuestToken,
        });

        if (!guestCart) {
          return false;
        }

        const guestItems = await this.findCartItems({
          queryRunner,
          cartId: guestCart.id,
        });

        if (!guestItems.length) {
          await queryRunner.manager.delete(CartEntity, { id: guestCart.id });

          return true;
        }

        const userCart = await this.findCartByOwner({
          queryRunner,
          userId,
        });

        if (isNewUser || !userCart) {
          await this.convertGuestCartToUser({
            queryRunner,
            cartId: guestCart.id,
            userId,
          });

          return true;
        }

        const userItems = await this.findCartItems({
          queryRunner,
          cartId: userCart.id,
        });

        await this.mergeCartItems({
          queryRunner,
          userCartId: userCart.id,
          userItems,
          guestItems,
        });

        await queryRunner.manager.delete(CartEntity, { id: guestCart.id });

        return true;
      },
    });

    if (shouldClearCache) {
      await clearCartCache({
        redisService: this.redisService,
        userId,
        guestToken: validatedGuestToken,
      });
    }
  }

  private async findOrCreateCart({ queryRunner, userId, guestToken }: FindOrCreateCartParams): Promise<CartEntity> {
    const cart = await this.findCartByOwner({ queryRunner, userId, guestToken });

    if (cart) {
      return cart;
    }

    const newCart = queryRunner.manager.create(CartEntity, {
      userId,
      guestToken,
    });

    return queryRunner.manager.save(newCart);
  }

  private async findCartItem({ queryRunner, cartId, productId }: FindCartItemParams): Promise<CartItemEntity | null> {
    return queryRunner.manager
      .getRepository(CartItemEntity)
      .createQueryBuilder("cartItem")
      .select(CART_SELECT_FIELDS.CART_ITEM)
      .where("cartItem.cartId = :cartId", { cartId })
      .andWhere("cartItem.productId = :productId", { productId })
      .getOne();
  }

  private async getAvailableProduct({ queryRunner, productId }: GetAvailableProductParams): Promise<ProductEntity> {
    const product = await queryRunner.manager
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .select(CART_SELECT_FIELDS.PRODUCT)
      .innerJoin(VendorProfileEntity, "vendor", "vendor.id = product.vendorId AND vendor.status = :vendorStatus", {
        vendorStatus: VendorStatusEnum.APPROVED,
      })
      .where(
        `
          product.id = :productId
          AND product.status = :status
          AND product.isActive = true
        `,
        {
          productId,
          status: ProductStatusEnum.APPROVED,
        },
      )
      .getOne();

    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  private async findAvailableProductsByIds({
    queryRunner,
    productIds,
  }: FindAvailableProductsByIdsParams): Promise<ProductEntity[]> {
    if (!productIds.length) {
      return [];
    }

    return queryRunner.manager
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .select(CART_SELECT_FIELDS.PRODUCT)
      .innerJoin(VendorProfileEntity, "vendor", "vendor.id = product.vendorId AND vendor.status = :vendorStatus", {
        vendorStatus: VendorStatusEnum.APPROVED,
      })
      .where(` product.id IN (:...productIds) AND product.status = :status AND product.isActive = true`, {
        productIds,
        status: ProductStatusEnum.APPROVED,
      })
      .getMany();
  }

  private async findCartItems({ queryRunner, cartId }: FindCartItemsParams): Promise<CartItemEntity[]> {
    return queryRunner.manager
      .getRepository(CartItemEntity)
      .createQueryBuilder("cartItem")
      .select(CART_SELECT_FIELDS.CART_ITEM)
      .where("cartItem.cartId = :cartId", { cartId })
      .getMany();
  }

  private async convertGuestCartToUser({ queryRunner, cartId, userId }: ConvertGuestCartToUserParams): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .update(CartEntity)
      .set({
        userId,
        guestToken: null,
      })
      .where("id = :cartId", { cartId })
      .execute();
  }

  private async mergeCartItems({
    queryRunner,
    userCartId,
    userItems,
    guestItems,
  }: MergeCartItemsParams): Promise<void> {
    const productIds = [...new Set(guestItems.map((item) => item.productId))];

    // only merge the products that are currently purchasable
    const products = await this.findAvailableProductsByIds({
      queryRunner,
      productIds,
    });

    const mergeInstructions = buildMergeInstructions(userItems, guestItems, products);

    for (const instruction of mergeInstructions) {
      switch (instruction.action) {
        case "DELETE_USER_ITEM":
          // Remove items that are no longer valid after stock reconciliation.
          await queryRunner.manager.delete(CartItemEntity, { id: instruction.itemId });
          break;

        case "UPDATE_USER_ITEM":
          // Update existing user cart quantities using the merged value.
          await queryRunner.manager
            .createQueryBuilder()
            .update(CartItemEntity)
            .set({ quantity: instruction.finalQuantity })
            .where("id = :id", { id: instruction.itemId })
            .execute();
          break;

        case "MIGRATE_GUEST_ITEM":
          // Move guest cart items into the user's cart.
          await queryRunner.manager
            .createQueryBuilder()
            .update(CartItemEntity)
            .set({
              cartId: userCartId,
              quantity: instruction.finalQuantity,
            })
            .where("id = :id", { id: instruction.itemId })
            .execute();
          break;
      }
    }
  }

  private async getCartItemOrFail({
    queryRunner,
    productId,
    userId,
    guestToken,
  }: GetCartItemOrFailParams): Promise<CartItemLookupResult> {
    const cart = await this.findCartByOwner({
      queryRunner,
      userId,
      guestToken,
    });

    if (!cart) {
      throw new NotFoundException(ERROR_MESSAGES.CART_NOT_FOUND);
    }

    const cartItem = await this.findCartItem({
      queryRunner,
      cartId: cart.id,
      productId,
    });

    if (!cartItem) {
      throw new NotFoundException(ERROR_MESSAGES.CART_ITEM_NOT_FOUND);
    }

    return {
      cart,
      cartItem,
    };
  }

  private async findCartByOwner({
    userId,
    guestToken,
    queryRunner,
    includeItems = false,
  }: FindCartByOwnerParams): Promise<CartEntity | null> {
    const repository = queryRunner
      ? queryRunner.manager.getRepository(CartEntity)
      : this.databaseService.getRepository(CartEntity);

    const query = repository.createQueryBuilder("cart").select(CART_SELECT_FIELDS.CART);

    if (includeItems) {
      query
        .leftJoinAndSelect("cart.cartItems", "cartItem")
        .addSelect(CART_SELECT_FIELDS.CART_ITEM)
        .leftJoinAndMapOne("cartItem.product", ProductEntity, "product", "product.id = cartItem.productId")
        .addSelect(CART_SELECT_FIELDS.PRODUCT)
        .leftJoinAndMapOne("product.vendor", VendorProfileEntity, "vendor", "vendor.id = product.vendorId")
        .addSelect(CART_SELECT_FIELDS.VENDOR);
    }

    query.where(userId ? "cart.userId = :owner" : "cart.guestToken = :owner", {
      owner: userId ?? guestToken,
    });

    return query.getOne();
  }
}
