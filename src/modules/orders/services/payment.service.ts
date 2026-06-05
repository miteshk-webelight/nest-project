/* eslint-disable @cspell/spellchecker */
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { QueryRunner } from "typeorm";

import { RazorpayService } from "src/modules/payments/razorpay.service";

import { DatabaseService } from "../../database/database.service";
import { ProductEntity } from "../../products/product.entity";
import { ProductStatusEnum } from "../../products/products.constants";
import { VendorProfileEntity } from "../../vendors/vendor.profile.entity";
import { VendorStatusEnum } from "../../vendors/vendors.constants";
import { OrderItemEntity } from "../entities/order-item.entity";
import { OrderEntity } from "../entities/order.entity";
import { VendorOrderEntity } from "../entities/vendor-order.entity";
import { convertToPaise } from "../order.utils";
import { ERROR_MESSAGES, ORDER_ERROR_CONTEXT, ORDER_SELECT_FIELDS, PAYMENT_CURRENCY } from "../orders.constants";
import { OrderStatusEnum, PaymentStatusEnum } from "../orders.enums";
import { PaymentResponse } from "../responses/payment.response";

@Injectable()
export class PaymentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly razorpayService: RazorpayService,
  ) {}

  /**
   * Initiates payment for a pending order.
   *
   * If a Razorpay order has already been created,
   * the existing payment details are returned to
   * prevent duplicate payment order creation.
   *
   * Product availability is revalidated before
   * creating a Razorpay order to ensure inventory
   * has not changed since checkout.
   *
   * @param orderId Order identifier.
   * @param userId Authenticated user identifier.
   *
   * @returns Razorpay payment initiation details.
   */
  async initiatePayment(orderId: string, userId: string): Promise<PaymentResponse> {
    return this.databaseService.executeTransaction<PaymentResponse>({
      errorContext: ORDER_ERROR_CONTEXT.INITIATE_PAYMENT,
      operation: async (queryRunner: QueryRunner) => {
        const order = await this.loadOrderForPayment(orderId, userId, queryRunner);

        if (order.paymentStatus === PaymentStatusEnum.PAID) {
          throw new BadRequestException(ERROR_MESSAGES.ORDER_ALREADY_PAID);
        }

        if (order.razorpayOrderId) {
          return {
            orderId: order.id,
            razorpayOrderId: order.razorpayOrderId,
            amount: convertToPaise(Number(order.totalAmount)),
          };
        }

        await this.revalidateProducts(orderId, queryRunner);

        const amountInPaise = convertToPaise(Number(order.totalAmount));
        const razorpayOrder = await this.razorpayService.createOrder({
          amount: amountInPaise,
          currency: PAYMENT_CURRENCY.INR,
          receipt: order.orderNumber,
        });

        await queryRunner.manager.update(OrderEntity, orderId, {
          razorpayOrderId: razorpayOrder.id,
        });

        return {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: amountInPaise,
        };
      },
    });
  }

  private async loadOrderForPayment(orderId: string, userId: string, queryRunner: QueryRunner): Promise<OrderEntity> {
    const order = await queryRunner.manager
      .getRepository(OrderEntity)
      .createQueryBuilder("order")
      .setLock("pessimistic_write")
      .select(ORDER_SELECT_FIELDS.ORDER_FOR_PAYMENT)
      .where(`order.id = :orderId AND order.userId = :userId AND order.status = :status`, {
        orderId,
        userId,
        status: OrderStatusEnum.PENDING,
      })
      .getOne();

    if (!order) {
      throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  /**
   * Revalidates ordered products before payment.
   *
   * Ensures:
   * - Products still exist
   * - Products remain approved
   * - Products remain active
   * - Vendors remain approved
   * - Sufficient inventory is available
   *
   * Prevents payment for products that became
   * unavailable after checkout.
   */
  private async revalidateProducts(orderId: string, queryRunner: QueryRunner): Promise<void> {
    const orderItems = await queryRunner.manager
      .getRepository(OrderItemEntity)
      .createQueryBuilder("orderItem")
      .select(ORDER_SELECT_FIELDS.ORDER_ITEM)
      .innerJoin(VendorOrderEntity, "vendorOrder", "vendorOrder.id = orderItem.vendorOrderId")
      .where("vendorOrder.orderId = :orderId", {
        orderId,
      })
      .getMany();

    if (!orderItems.length) {
      throw new BadRequestException(ERROR_MESSAGES.ORDER_CONTAINS_NO_ITEMS);
    }

    const productIds = orderItems.map((item) => item.productId);

    const products = await queryRunner.manager
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .select(ORDER_SELECT_FIELDS.PRODUCT_INFO)
      .innerJoin(VendorProfileEntity, "vendor", "vendor.id = product.vendorId AND vendor.status = :vendorStatus", {
        vendorStatus: VendorStatusEnum.APPROVED,
      })
      .where(`product.id IN (:...productIds) AND product.status = :status AND product.isActive = true`, {
        productIds,
        status: ProductStatusEnum.APPROVED,
      })
      .getMany();

    const productsMap = new Map(products.map((product) => [product.id, product]));

    for (const orderItem of orderItems) {
      const product = productsMap.get(orderItem.productId);
      if (!product || product.stock < orderItem.quantity) {
        throw new BadRequestException(ERROR_MESSAGES.INSUFFICIENT_STOCK);
      }
    }
  }
}
