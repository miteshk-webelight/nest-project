import { Injectable, NotFoundException } from "@nestjs/common";

import { QueryRunner } from "typeorm";
import { ulid } from "ulid";

import { DatabaseService } from "../database/database.service";
import { ProductEntity } from "../products/product.entity";
import { ProductStatusEnum } from "../products/products.constants";
import { RedisService } from "../redis/redis.service";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { GUEST_TOKEN_PREFIX, CART_SELECT_FIELDS, ERROR_MESSAGES } from "./carts.constants";
import { CartOwner } from "./carts.types";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { CartItemEntity } from "./entities/cart-items.entity";
import { CartEntity } from "./entities/carts.entity";
import { CartResponse } from "./response/cart.response";
import { clearCartCache, getCachedCart } from "./utils/cart-cache.utils";
import { resolveCartOwner, validateStock, validateGuestToken } from "./utils/cart-validation.utils";
import { buildCartResponse, mapCartToResponse } from "./utils/cart.utils";

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

  async addCartItem({
    dto,
    guestToken,
    user,
  }: {
    dto: AddCartItemDto;
    guestToken?: string;
    user?: UsersEntity;
  }): Promise<void> {
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
          await queryRunner.manager.insert(CartItemEntity, {
            cartId: cart.id,
            productId: dto.productId,
            quantity: dto.quantity,
            priceSnapshot: product.price,
            discountPriceSnapshot: product.discountPrice,
            slugSnapshot: product.slug,
            nameSnapshot: product.name,
          });
        }
      },
    });

    await clearCartCache({
      redisService: this.redisService,
      userId: cartOwner.userId,
      guestToken: cartOwner.guestToken,
    });
  }

  async getCurrentCart({ guestToken, user }: { guestToken?: string; user?: UsersEntity }): Promise<CartResponse> {
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

  private async findOrCreateCart({
    queryRunner,
    userId,
    guestToken,
  }: {
    queryRunner: QueryRunner;
    userId?: string;
    guestToken?: string;
  }): Promise<CartEntity> {
    const cart = await this.findCartByOwner({ queryRunner, userId, guestToken });

    if (cart) {
      return cart;
    }

    return queryRunner.manager.save(CartEntity, {
      userId,
      guestToken,
    });
  }

  private async findCartItem({
    queryRunner,
    cartId,
    productId,
  }: {
    queryRunner: QueryRunner;
    cartId: string;
    productId: string;
  }): Promise<CartItemEntity | null> {
    return queryRunner.manager
      .getRepository(CartItemEntity)
      .createQueryBuilder("cartItem")
      .select(CART_SELECT_FIELDS.CART_ITEM)
      .where("cartItem.cartId = :cartId", { cartId })
      .andWhere("cartItem.productId = :productId", { productId })
      .getOne();
  }

  private async getAvailableProduct({
    queryRunner,
    productId,
  }: {
    queryRunner: QueryRunner;
    productId: string;
  }): Promise<ProductEntity> {
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

  private async findCartByOwner({
    userId,
    guestToken,
    queryRunner,
    includeItems = false,
  }: {
    userId?: string;
    guestToken?: string;
    queryRunner?: QueryRunner;
    includeItems?: boolean;
  }): Promise<CartEntity | null> {
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
