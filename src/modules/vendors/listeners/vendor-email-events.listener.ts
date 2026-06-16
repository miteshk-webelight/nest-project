import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { EMAIL_TYPES } from "../../email/constants/email-types.constants";
import { EmailQueueService } from "../../workers/services/email-queue.service";
import {
  type VendorDeletedEventPayload,
  type VendorRegisteredEventPayload,
  type VendorStatusChangedEventPayload,
  VendorEvents,
} from "../constants/vendor-events";

@Injectable()
export class VendorEmailEventsListener {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @OnEvent(VendorEvents.VENDOR_REGISTERED)
  async handleVendorRegistered(payload: VendorRegisteredEventPayload): Promise<void> {
    await Promise.all([
      this.emailQueueService.addEmailJob({
        type: EMAIL_TYPES.VENDOR_REGISTRATION_ADMIN,
        email: payload.adminEmail,
        data: { businessName: payload.businessName, ownerName: payload.ownerFirstName },
      }),
      this.emailQueueService.addEmailJob({
        type: EMAIL_TYPES.VENDOR_REGISTRATION_RECEIVED,
        email: payload.ownerEmail,
        data: { ownerFirstName: payload.ownerFirstName, businessName: payload.businessName },
      }),
    ]);
  }

  @OnEvent(VendorEvents.VENDOR_APPROVED)
  async handleVendorApproved(payload: VendorStatusChangedEventPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.VENDOR_APPROVED,
      email: payload.ownerEmail,
      data: { vendorName: payload.ownerFirstName },
    });
  }

  @OnEvent(VendorEvents.VENDOR_REJECTED)
  async handleVendorRejected(payload: VendorStatusChangedEventPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.VENDOR_REJECTED,
      email: payload.ownerEmail,
      data: { vendorName: payload.ownerFirstName },
    });
  }

  @OnEvent(VendorEvents.VENDOR_SUSPENDED)
  async handleVendorSuspended(payload: VendorStatusChangedEventPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.VENDOR_SUSPENDED,
      email: payload.ownerEmail,
      data: { vendorName: payload.ownerFirstName },
    });
  }

  @OnEvent(VendorEvents.VENDOR_DELETED)
  async handleVendorDeleted(payload: VendorDeletedEventPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.VENDOR_DELETED,
      email: payload.ownerEmail,
      data: { vendorName: payload.ownerFirstName },
    });
  }
}
