import * as crypto from "crypto";

import { Injectable } from "@nestjs/common";

import Razorpay from "razorpay";
import { Orders } from "razorpay/dist/types/orders";
import { Refunds } from "razorpay/dist/types/refunds";

import { razorpayConfig } from "src/config/razorpay.config";
import { logger } from "src/services/logger.service";

@Injectable()
export class RazorpayService {
  private readonly razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: razorpayConfig.keyId,
      key_secret: razorpayConfig.keySecret,
    });
  }

  async createOrder(options: {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<Orders.RazorpayOrder> {
    try {
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      logger.error("Error creating Razorpay order:", error);
      throw error;
    }
  }

  verifyWebhookSignature(webhookBody: string, webhookSignature: string, webhookSecret: string): boolean {
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(webhookBody).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(webhookSignature));
  }

  async refundPayment(paymentId: string, amount?: number): Promise<Refunds.RazorpayRefund> {
    try {
      const refundOptions: { payment_id: string; amount?: number } = {
        payment_id: paymentId,
      };

      if (amount) {
        refundOptions.amount = amount;
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundOptions);
      return refund;
    } catch (error) {
      logger.error("Error refunding Razorpay payment:", error);
      throw error;
    }
  }
}
