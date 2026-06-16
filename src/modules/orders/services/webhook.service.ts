import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { QueryRunner } from "typeorm";

import { razorpayConfig } from "src/config/razorpay.config";
import { PaymentEvents } from "src/modules/payments/constants/payment-events";
import { RazorpayService } from "src/modules/payments/razorpay.service";
import { logger } from "src/services/logger.service";

import { CartItemEntity } from "../../carts/entities/cart-items.entity";
import { CartEntity } from "../../carts/entities/carts.entity";
import { DatabaseService } from "../../database/database.service";
import { ProductEntity } from "../../products/product.entity";
import { UsersEntity } from "../../users/entity/users.entity";
import { OrderItemEntity } from "../entities/order-item.entity";
import { OrderEntity } from "../entities/order.entity";
import { VendorOrderEntity } from "../entities/vendor-order.entity";
import { convertToPaise } from "../order.utils";
import { ERROR_MESSAGES, ORDER_ERROR_CONTEXT, ORDER_SELECT_FIELDS } from "../orders.constants";
import { OrderStatusEnum, PaymentStatusEnum, VendorOrderStatusEnum } from "../orders.enums";

import type { RazorpayWebhookEvent } from "../orders.interface";

@Injectable()
export class WebhookService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly razorpayService: RazorpayService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Handles Razorpay payment.captured webhook.
   *
   * Workflow:
   * - Verify webhook signature
   * - Load and lock order
   * - Prevent duplicate processing
   * - Validate payment amount
   * - Atomically decrement stock
   * - Confirm order or trigger refund
   */
  async processPaymentCaptured(event: RazorpayWebhookEvent, rawBody: string, signature: string): Promise<void> {
    const { webhookSecret } = razorpayConfig;

    if (!webhookSecret) {
      throw new BadRequestException(ERROR_MESSAGES.WEBHOOK_SECRET_MISSING);
    }

    const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      throw new BadRequestException(ERROR_MESSAGES.WEBHOOK_SIGNATURE_INVALID);
    }

    const orderData = await this.databaseService.executeTransaction({
      errorContext: ORDER_ERROR_CONTEXT.PROCESS_WEBHOOK,
      operation: async (queryRunner: QueryRunner) => {
        const order = await this.findOrderForWebhook(event.razorpayOrderId, queryRunner);

        if (order.paymentStatus === PaymentStatusEnum.PAID) {
          logger.info(`Order ${order.orderNumber} already paid, skipping webhook processing`);
          return null;
        }

        const expectedAmount = convertToPaise(Number(order.totalAmount));

        if (event.amount !== expectedAmount) {
          throw new BadRequestException(ERROR_MESSAGES.WEBHOOK_AMOUNT_MISMATCH);
        }

        const orderItems = await this.loadOrderItems(order.id, queryRunner);

        const stockUpdateSuccess = await this.atomicStockDecrement(orderItems, queryRunner);

        if (!stockUpdateSuccess) {
          await this.handleStockFailure(order, event.razorpayPaymentId, queryRunner);
          return null;
        }

        await this.handlePaymentSuccess(order, event.razorpayPaymentId, queryRunner);

        return {
          userId: order.userId,
          orderId: order.id,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
        };
      },
    });

    if (!orderData) {
      return;
    }

    const userRepository = this.databaseService.getRepository(UsersEntity);

    const user = await userRepository.findOne({ where: { id: orderData.userId } });

    this.eventEmitter.emit(PaymentEvents.PAYMENT_COMPLETED, {
      orderId: orderData.orderId,
      userId: orderData.userId,
      userEmail: user?.email ?? "",
      firstName: user?.firstName ?? "",
      amount: String(orderData.totalAmount),
      paymentMethod: orderData.paymentMethod,
      paymentStatus: PaymentStatusEnum.PAID,
      paidAt: new Date().toISOString(),
    });
  }

  async processPaymentFailed(event: RazorpayWebhookEvent): Promise<void> {
    const orderData = await this.databaseService.executeTransaction({
      errorContext: ORDER_ERROR_CONTEXT.PROCESS_WEBHOOK,
      operation: async (queryRunner: QueryRunner) => {
        const order = await this.findOrderForWebhook(event.razorpayOrderId, queryRunner);

        await queryRunner.manager.update(OrderEntity, order.id, {
          paymentStatus: PaymentStatusEnum.FAILED,
        });

        logger.info(`Order ${order.orderNumber} payment failed`);

        return {
          userId: order.userId,
          orderId: order.id,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
        };
      },
    });

    const userRepository = this.databaseService.getRepository(UsersEntity);

    const user = await userRepository.findOne({ where: { id: orderData.userId } });

    this.eventEmitter.emit(PaymentEvents.PAYMENT_FAILED, {
      orderId: orderData.orderId,
      userId: orderData.userId,
      userEmail: user?.email ?? "",
      firstName: user?.firstName ?? "",
      amount: String(orderData.totalAmount),
      paymentMethod: orderData.paymentMethod,
      paymentStatus: PaymentStatusEnum.FAILED,
      failedAt: new Date().toISOString(),
    });
  }

  private async findOrderForWebhook(razorpayOrderId: string, queryRunner: QueryRunner): Promise<OrderEntity> {
    const order = await queryRunner.manager
      .getRepository(OrderEntity)
      .createQueryBuilder("order")
      .select(ORDER_SELECT_FIELDS.ORDER_FOR_WEBHOOK)
      .where("order.razorpayOrderId = :razorpayOrderId", { razorpayOrderId })
      .setLock("pessimistic_write")
      .getOne();

    if (!order) {
      throw new BadRequestException(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  private async loadOrderItems(orderId: string, queryRunner: QueryRunner): Promise<OrderItemEntity[]> {
    return queryRunner.manager
      .getRepository(OrderItemEntity)
      .createQueryBuilder("orderItem")
      .select(ORDER_SELECT_FIELDS.ORDER_ITEM)
      .innerJoin(VendorOrderEntity, "vendorOrder", "vendorOrder.id = orderItem.vendorOrderId")
      .where("vendorOrder.orderId = :orderId", {
        orderId,
      })
      .getMany();
  }

  /**
   * Atomically decrements inventory for all order items.
   *
   * Uses conditional stock updates to prevent overselling
   * when multiple orders compete for the same inventory.
   *
   * Returns false if any product no longer has sufficient stock.
   */
  private async atomicStockDecrement(orderItems: OrderItemEntity[], queryRunner: QueryRunner): Promise<boolean> {
    for (const orderItem of orderItems) {
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(ProductEntity)
        .set({ stock: () => `stock - ${orderItem.quantity}` })
        .where("id = :productId", { productId: orderItem.productId })
        .andWhere("stock >= :quantity", { quantity: orderItem.quantity })
        .execute();

      if (result.affected !== 1) {
        logger.warn(`Stock decrement failed for product ${orderItem.productId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Marks the order as stock unavailable after payment capture.
   *
   * A refund is initiated because payment succeeded but
   * inventory could not be reserved.
   */
  private async handleStockFailure(
    order: OrderEntity,
    razorpayPaymentId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.manager.update(OrderEntity, order.id, {
      paymentStatus: PaymentStatusEnum.PAID,
      status: OrderStatusEnum.STOCK_UNAVAILABLE,
      razorpayPaymentId,
    });

    try {
      await this.razorpayService.refundPayment(razorpayPaymentId);
      logger.info(`Refund initiated for order ${order.orderNumber} due to stock unavailability`);
    } catch (error) {
      logger.error(`Failed to initiate refund for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * Handles successful payment confirmation.
   *
   * Updates order state, activates vendor orders,
   * clears the customer's cart and finalizes checkout.
   */
  private async handlePaymentSuccess(
    order: OrderEntity,
    razorpayPaymentId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.manager.update(OrderEntity, order.id, {
      paymentStatus: PaymentStatusEnum.PAID,
      status: OrderStatusEnum.CONFIRMED,
      razorpayPaymentId,
      placedAt: new Date(),
    });

    await queryRunner.manager
      .getRepository(VendorOrderEntity)
      .createQueryBuilder("vendorOrders")
      .update(VendorOrderEntity)
      .set({
        status: VendorOrderStatusEnum.PENDING,
      })
      .where("orderId = :orderId", {
        orderId: order.id,
      })
      .execute();

    const cart = await queryRunner.manager.findOne(CartEntity, {
      where: {
        userId: order.userId,
      },
    });

    if (cart) {
      await queryRunner.manager.delete(CartItemEntity, {
        cartId: cart.id,
      });

      await queryRunner.manager.delete(CartEntity, {
        id: cart.id,
      });
    }

    logger.info(`Order ${order.orderNumber} confirmed successfully`);
  }
}
