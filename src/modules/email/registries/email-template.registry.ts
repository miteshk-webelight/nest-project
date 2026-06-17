import { Injectable } from "@nestjs/common";

import { EMAIL_TYPES } from "../constants/email-types.constants";
import { authEmailTemplates, AuthWelcomeData } from "../templates/auth.templates";
import {
  orderEmailTemplates,
  OrderCancelledUserData,
  OrderCancelledVendorData,
  OrderConfirmedData,
  OrderDeliveredData,
  OrderRefundUserData,
  OrderRefundVendorData,
  VendorOrderCreatedData,
} from "../templates/order.templates";
import { paymentEmailTemplates, PaymentFailedData, PaymentSuccessData } from "../templates/payment.templates";
import {
  productEmailTemplates,
  ProductStatusChangeData,
  ProductSubmittedAdminData,
} from "../templates/product.templates";
import {
  vendorEmailTemplates,
  VendorData,
  VendorRegistrationAdminData,
  VendorRegistrationReceivedData,
} from "../templates/vendor.templates";

export interface EmailTemplate<T> {
  subject: (data: T) => string;
  html: (data: T) => string;
}

@Injectable()
export class EmailTemplateRegistry {
  private readonly templates = new Map<string, EmailTemplate<unknown>>();

  constructor() {
    this.register<AuthWelcomeData>(EMAIL_TYPES.AUTH_WELCOME, authEmailTemplates.welcome);

    this.register<VendorRegistrationAdminData>(
      EMAIL_TYPES.VENDOR_REGISTRATION_ADMIN,
      vendorEmailTemplates.registrationAdmin,
    );
    this.register<VendorRegistrationReceivedData>(
      EMAIL_TYPES.VENDOR_REGISTRATION_RECEIVED,
      vendorEmailTemplates.registrationReceived,
    );
    this.register<VendorData>(EMAIL_TYPES.VENDOR_APPROVED, vendorEmailTemplates.approved);
    this.register<VendorData>(EMAIL_TYPES.VENDOR_REJECTED, vendorEmailTemplates.rejected);
    this.register<VendorData>(EMAIL_TYPES.VENDOR_SUSPENDED, vendorEmailTemplates.suspended);
    this.register<VendorData>(EMAIL_TYPES.VENDOR_DELETED, vendorEmailTemplates.deleted);

    this.register<ProductSubmittedAdminData>(
      EMAIL_TYPES.PRODUCT_SUBMITTED_ADMIN,
      productEmailTemplates.submittedForReviewAdmin,
    );
    this.register<ProductStatusChangeData>(EMAIL_TYPES.PRODUCT_APPROVED, productEmailTemplates.approved);
    this.register<ProductStatusChangeData>(EMAIL_TYPES.PRODUCT_REJECTED, productEmailTemplates.rejected);

    this.register<PaymentSuccessData>(EMAIL_TYPES.PAYMENT_SUCCESS, paymentEmailTemplates.success);
    this.register<PaymentFailedData>(EMAIL_TYPES.PAYMENT_FAILED, paymentEmailTemplates.failed);

    this.register<VendorOrderCreatedData>(EMAIL_TYPES.ORDER_CREATED_VENDOR, orderEmailTemplates.vendorOrderCreated);
    this.register<OrderConfirmedData>(EMAIL_TYPES.ORDER_CONFIRMED_USER, orderEmailTemplates.orderConfirmed);
    this.register<OrderDeliveredData>(EMAIL_TYPES.ORDER_DELIVERED_USER, orderEmailTemplates.orderDelivered);
    this.register<OrderCancelledVendorData>(
      EMAIL_TYPES.ORDER_CANCELLED_VENDOR,
      orderEmailTemplates.orderCancelledVendor,
    );
    this.register<OrderCancelledUserData>(EMAIL_TYPES.ORDER_CANCELLED_USER, orderEmailTemplates.orderCancelledUser);
    this.register<OrderRefundUserData>(EMAIL_TYPES.ORDER_REFUNDED_USER, orderEmailTemplates.refundUser);
    this.register<OrderRefundVendorData>(EMAIL_TYPES.ORDER_REFUNDED_VENDOR, orderEmailTemplates.refundVendor);
  }

  private register<T>(type: string, template: EmailTemplate<T>): void {
    if (this.templates.has(type)) {
      throw new Error(`Template already registered for email type: ${type}`);
    }

    this.templates.set(type, template);
  }

  get<T>(type: string): EmailTemplate<T> {
    const template = this.templates.get(type);

    if (!template) {
      throw new Error(`No template registered for email type: ${type}`);
    }

    return template;
  }
}
