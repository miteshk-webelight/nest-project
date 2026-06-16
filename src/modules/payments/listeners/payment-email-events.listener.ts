import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { EmailQueueService } from "../../workers/services/email-queue.service";
import {
  type PaymentCompletedPayload,
  type PaymentFailedPayload,
  PAYMENT_EVENT_EMAIL_TYPE_MAP,
  PaymentEvents,
} from "../constants/payment-events";

@Injectable()
export class PaymentEmailEventsListener {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @OnEvent(PaymentEvents.PAYMENT_COMPLETED)
  async handlePaymentCompleted(payload: PaymentCompletedPayload): Promise<void> {
    await this.enqueuePaymentEmail(PaymentEvents.PAYMENT_COMPLETED, payload, payload.paidAt);
  }

  @OnEvent(PaymentEvents.PAYMENT_FAILED)
  async handlePaymentFailed(payload: PaymentFailedPayload): Promise<void> {
    await this.enqueuePaymentEmail(PaymentEvents.PAYMENT_FAILED, payload, payload.failedAt);
  }

  private async enqueuePaymentEmail(
    event: string,
    payload: PaymentCompletedPayload | PaymentFailedPayload,
    dateTime: string,
  ): Promise<void> {
    const emailType = PAYMENT_EVENT_EMAIL_TYPE_MAP[event];

    if (!emailType) {
      return;
    }

    await this.emailQueueService.addEmailJob({
      type: emailType,
      email: payload.userEmail,
      data: {
        orderId: payload.orderId,
        paymentMethod: payload.paymentMethod,
        amount: payload.amount,
        paymentStatus: payload.paymentStatus,
        dateTime,
      },
    });
  }
}
