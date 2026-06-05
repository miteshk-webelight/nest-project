import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";

import { QueryRunner } from "typeorm";

import { CartItemEntity } from "../../carts/entities/cart-items.entity";
import { CartEntity } from "../../carts/entities/carts.entity";
import { DatabaseService } from "../../database/database.service";
import { ProductEntity } from "../../products/product.entity";
import { ProductStatusEnum } from "../../products/products.constants";
import { AddressEntity } from "../../users/entity/address.entity";
import { VendorProfileEntity } from "../../vendors/vendor.profile.entity";
import { VendorStatusEnum } from "../../vendors/vendors.constants";
import { CheckoutDto } from "../dto/checkout.dto";
import { OrderItemEntity } from "../entities/order-item.entity";
import { OrderEntity } from "../entities/order.entity";
import { VendorOrderEntity } from "../entities/vendor-order.entity";
import { calculateCheckoutPricing, generateOrderNumber, groupCartItemsByVendor } from "../order.utils";
import { ERROR_MESSAGES, ORDER_ERROR_CONTEXT, ORDER_SELECT_FIELDS } from "../orders.constants";
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, VendorOrderStatusEnum } from "../orders.enums";
import { CheckoutResponse } from "../responses/checkout.response";

import type {
  CreateOrderItemsParams,
  CreateOrderParams,
  CreateOrderRecordParams,
  CreateVendorOrdersParams,
  LoadCartItemsParams,
  LoadValidatedAddressParams,
  LoadValidatedCartParams,
  LoadValidatedProductsParams,
  ProductMap,
} from "../orders.interface";

@Injectable()
export class CheckoutService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Creates an order from the current cart.
   *
   * Workflow:
   * - Validate address
   * - Load cart and cart items
   * - Validate products and stock
   * - Group items by vendor
   * - Create order hierarchy
   *
   * @param dto Checkout request payload
   * @param userId Authenticated user id
   *
   * @returns Created order details
   */
  async checkout(dto: CheckoutDto, userId: string): Promise<CheckoutResponse> {
    return this.databaseService.executeTransaction<CheckoutResponse>({
      errorContext: ORDER_ERROR_CONTEXT.CHECKOUT,
      operation: async (queryRunner: QueryRunner) => {
        const address = await this.loadValidatedAddress({ addressId: dto.addressId, userId, queryRunner });
        const cart = await this.loadValidatedCart({ userId, queryRunner });
        const cartItems = await this.loadCartItems({ cartId: cart.id, queryRunner });

        if (!cartItems.length) {
          throw new BadRequestException(ERROR_MESSAGES.CART_EMPTY);
        }

        const productIds = [...new Set(cartItems.map((item) => item.productId))];
        const products = await this.loadValidatedProducts({ productIds, queryRunner });
        const productsMap: ProductMap = new Map(products.map((product) => [product.id, product]));

        this.validateCartItemsStock(cartItems, productsMap);

        const groupedItems = groupCartItemsByVendor(cartItems, productsMap);
        const pricingSummary = calculateCheckoutPricing(groupedItems, productsMap);
        const order = await this.createOrder({
          userId,
          addressId: address.id,
          pricingSummary,
          queryRunner,
        });
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          paymentStatus: order.paymentStatus,
        };
      },
    });
  }

  private async loadValidatedAddress({
    addressId,
    userId,
    queryRunner,
  }: LoadValidatedAddressParams): Promise<AddressEntity> {
    const address = await queryRunner.manager
      .getRepository(AddressEntity)
      .createQueryBuilder("address")
      .where("address.id = :addressId", { addressId })
      .andWhere("address.userId = :userId", { userId })
      .getOne();

    if (!address) {
      throw new NotFoundException(ERROR_MESSAGES.ADDRESS_NOT_FOUND);
    }

    return address;
  }

  private async loadValidatedCart({ userId, queryRunner }: LoadValidatedCartParams): Promise<CartEntity> {
    const cart = await queryRunner.manager
      .getRepository(CartEntity)
      .createQueryBuilder("cart")
      .where("cart.userId = :userId", { userId })
      .getOne();

    if (!cart) {
      throw new NotFoundException(ERROR_MESSAGES.CART_NOT_FOUND);
    }

    return cart;
  }

  private async loadCartItems({ cartId, queryRunner }: LoadCartItemsParams): Promise<CartItemEntity[]> {
    return queryRunner.manager
      .getRepository(CartItemEntity)
      .createQueryBuilder("cartItems")
      .select(ORDER_SELECT_FIELDS.CART_ITEM)
      .where("cartItems.cartId = :cartId", { cartId })
      .getMany();
  }

  private async loadValidatedProducts({
    productIds,
    queryRunner,
  }: LoadValidatedProductsParams): Promise<ProductEntity[]> {
    const products = await queryRunner.manager
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .select(ORDER_SELECT_FIELDS.PRODUCT)
      .innerJoin(VendorProfileEntity, "vendor", "vendor.id = product.vendorId AND vendor.status = :vendorStatus", {
        vendorStatus: VendorStatusEnum.APPROVED,
      })
      .where(`product.id IN (:...productIds) AND product.status = :status AND product.isActive = true`, {
        productIds,
        status: ProductStatusEnum.APPROVED,
      })
      .getMany();

    if (products.length !== productIds.length) {
      // Query only returns products that are active, approved, and belong to approved vendors.
      // A count mismatch indicates at least one cart item is no longer eligible for checkout.
      throw new BadRequestException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return products;
  }

  private validateCartItemsStock(cartItems: CartItemEntity[], productsMap: ProductMap): void {
    for (const cartItem of cartItems) {
      const product = productsMap.get(cartItem.productId)!;
      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(ERROR_MESSAGES.INSUFFICIENT_STOCK);
      }
    }
  }

  private createOrderRecord({ userId, addressId, totalAmount, queryRunner }: CreateOrderRecordParams): OrderEntity {
    return queryRunner.manager.create(OrderEntity, {
      userId,
      addressId,
      orderNumber: generateOrderNumber(),
      totalAmount,
      paymentMethod: PaymentMethodEnum.RAZORPAY,
      paymentStatus: PaymentStatusEnum.PENDING,
      status: OrderStatusEnum.PENDING,
    });
  }

  /**
   * Creates the complete order hierarchy:
   *
   * - Order
   * - Vendor Orders
   * - Order Items
   *
   * Assumes all validation has already been completed.
   *
   * @returns Persisted order entity.
   */
  private async createOrder({
    userId,
    addressId,
    pricingSummary,
    queryRunner,
  }: CreateOrderParams): Promise<OrderEntity> {
    const { totalAmount } = pricingSummary;
    const order = this.createOrderRecord({ userId, addressId, totalAmount, queryRunner });
    const savedOrder = await queryRunner.manager.save(order);

    const vendorOrders = await this.createVendorOrders({
      orderId: savedOrder.id,
      pricingSummary,
      queryRunner,
    });

    const orderItems = this.createOrderItems({ vendorOrders, pricingSummary, queryRunner });
    await queryRunner.manager.save(OrderItemEntity, orderItems);

    return savedOrder;
  }

  /**
   * Creates vendor-specific orders for each vendor
   * participating in the checkout.
   *
   * Vendor totals are calculated independently
   * from the parent order total.
   */
  private async createVendorOrders({
    orderId,
    pricingSummary,
    queryRunner,
  }: CreateVendorOrdersParams): Promise<VendorOrderEntity[]> {
    const vendorOrders = pricingSummary.groups.map((group) =>
      queryRunner.manager.create(VendorOrderEntity, {
        orderId,
        vendorId: group.vendorId,
        totalAmount: group.totalAmount,
        status: VendorOrderStatusEnum.PENDING,
      }),
    );

    return queryRunner.manager.save(VendorOrderEntity, vendorOrders);
  }

  /**
   * Creates order item snapshots for all purchased products.
   *
   * Product information is denormalized into snapshots
   * so future product changes do not affect historical orders.
   */
  private createOrderItems({ vendorOrders, pricingSummary, queryRunner }: CreateOrderItemsParams): OrderItemEntity[] {
    const vendorOrderMap = new Map(vendorOrders.map((vendorOrder) => [vendorOrder.vendorId, vendorOrder]));

    const orderItems: OrderItemEntity[] = [];

    for (const group of pricingSummary.groups) {
      const vendorOrder = vendorOrderMap.get(group.vendorId);

      if (!vendorOrder) {
        throw new InternalServerErrorException(ERROR_MESSAGES.VENDOR_ORDER_MAPPING_FAILED);
      }

      for (const item of group.items) {
        orderItems.push(
          queryRunner.manager.create(OrderItemEntity, {
            vendorOrderId: vendorOrder.id,
            productId: item.cartItem.productId,
            quantity: item.cartItem.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            skuSnapshot: item.product.sku,
            nameSnapshot: item.product.name,
            slugSnapshot: item.product.slug,
          }),
        );
      }
    }

    return orderItems;
  }
}
