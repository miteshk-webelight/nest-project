import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { EMAIL_TYPES } from "../../email/constants/email-types.constants";
import { EmailQueueService } from "../../workers/services/email-queue.service";
import {
  type ProductStatusChangedPayload,
  type ProductSubmittedForReviewPayload,
  ProductEvents,
  PRODUCT_STATUS_EMAIL_TYPE_MAP,
} from "../constants/product-events";

@Injectable()
export class ProductEmailEventsListener {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @OnEvent(ProductEvents.PRODUCT_SUBMITTED_FOR_REVIEW)
  async handleProductSubmitted(payload: ProductSubmittedForReviewPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.PRODUCT_SUBMITTED_ADMIN,
      email: payload.adminEmail,
      data: { productName: payload.productName, vendorName: payload.vendorName },
    });
  }

  @OnEvent(ProductEvents.PRODUCT_STATUS_CHANGED)
  async handleProductStatusChanged(payload: ProductStatusChangedPayload): Promise<void> {
    const emailType = PRODUCT_STATUS_EMAIL_TYPE_MAP[payload.newStatus];

    if (!emailType) {
      return;
    }

    await this.emailQueueService.addEmailJob({
      type: emailType,
      email: payload.vendorEmail,
      data: { productName: payload.productName, vendorName: payload.vendorName },
    });
  }
}
