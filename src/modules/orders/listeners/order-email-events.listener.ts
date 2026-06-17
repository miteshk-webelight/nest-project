import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { EMAIL_TYPES } from "../../email/constants/email-types.constants";
import { EmailQueueService } from "../../workers/services/email-queue.service";
import {
  OrderEvents,
  type OrderCancelledByUserPayload,
  type OrderCancelledByVendorPayload,
  type OrderConfirmedPayload,
  type OrderCreatedPayload,
  type OrderDeliveredPayload,
  type OrderRefundedPayload,
} from "../constants/order-events";

@Injectable()
export class OrderEmailEventsListener {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @OnEvent(OrderEvents.ORDER_CREATED)
  async handleOrderCreated(payload: OrderCreatedPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.ORDER_CREATED_VENDOR,
      email: payload.vendorEmail,
      data: {
        orderId: payload.orderId,
        vendorName: payload.vendorName,
        customerName: payload.customerName,
        totalAmount: payload.totalAmount,
      },
    });
  }

  @OnEvent(OrderEvents.ORDER_CONFIRMED)
  async handleOrderConfirmed(payload: OrderConfirmedPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.ORDER_CONFIRMED_USER,
      email: payload.userEmail,
      data: {
        orderId: payload.orderId,
        firstName: payload.firstName,
        totalAmount: payload.totalAmount,
      },
    });
  }

  @OnEvent(OrderEvents.ORDER_DELIVERED)
  async handleOrderDelivered(payload: OrderDeliveredPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.ORDER_DELIVERED_USER,
      email: payload.userEmail,
      data: {
        orderId: payload.orderId,
        firstName: payload.firstName,
      },
    });
  }

  @OnEvent(OrderEvents.ORDER_CANCELLED_BY_VENDOR)
  async handleOrderCancelledByVendor(payload: OrderCancelledByVendorPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.ORDER_CANCELLED_VENDOR,
      email: payload.userEmail,
      data: {
        orderId: payload.orderId,
        firstName: payload.firstName,
      },
    });
  }

  @OnEvent(OrderEvents.ORDER_CANCELLED_BY_USER)
  async handleOrderCancelledByUser(payload: OrderCancelledByUserPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.ORDER_CANCELLED_USER,
      email: payload.userEmail,
      data: {
        orderId: payload.orderId,
        firstName: payload.firstName,
      },
    });
  }

  @OnEvent(OrderEvents.ORDER_REFUNDED)
  async handleOrderRefunded(payload: OrderRefundedPayload): Promise<void> {
    await Promise.all([
      this.emailQueueService.addEmailJob({
        type: EMAIL_TYPES.ORDER_REFUNDED_USER,
        email: payload.userEmail,
        data: {
          orderId: payload.orderId,
          amount: payload.amount,
          firstName: payload.firstName,
        },
      }),
      this.emailQueueService.addEmailJob({
        type: EMAIL_TYPES.ORDER_REFUNDED_VENDOR,
        email: payload.vendorEmail,
        data: {
          orderId: payload.orderId,
          amount: payload.amount,
          vendorName: payload.vendorName,
        },
      }),
    ]);
  }
}
