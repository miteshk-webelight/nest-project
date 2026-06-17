import type { EMAIL_TYPES } from "../../email/constants/email-types.constants";
import type { AuthWelcomeData } from "../../email/templates/auth.templates";
import type {
  OrderCancelledUserData,
  OrderCancelledVendorData,
  OrderConfirmedData,
  OrderDeliveredData,
  OrderRefundUserData,
  OrderRefundVendorData,
  VendorOrderCreatedData,
} from "../../email/templates/order.templates";
import type { PaymentFailedData, PaymentSuccessData } from "../../email/templates/payment.templates";
import type { ProductStatusChangeData, ProductSubmittedAdminData } from "../../email/templates/product.templates";
import type {
  VendorData,
  VendorRegistrationAdminData,
  VendorRegistrationReceivedData,
} from "../../email/templates/vendor.templates";

export interface EmailJobPayload<T = unknown> {
  type: string;
  email: string;
  data: T;
}

export interface EmailJobDataMap {
  [EMAIL_TYPES.AUTH_WELCOME]: AuthWelcomeData;

  [EMAIL_TYPES.VENDOR_REGISTRATION_ADMIN]: VendorRegistrationAdminData;
  [EMAIL_TYPES.VENDOR_REGISTRATION_RECEIVED]: VendorRegistrationReceivedData;
  [EMAIL_TYPES.VENDOR_APPROVED]: VendorData;
  [EMAIL_TYPES.VENDOR_REJECTED]: VendorData;
  [EMAIL_TYPES.VENDOR_SUSPENDED]: VendorData;
  [EMAIL_TYPES.VENDOR_DELETED]: VendorData;

  [EMAIL_TYPES.PRODUCT_SUBMITTED_ADMIN]: ProductSubmittedAdminData;
  [EMAIL_TYPES.PRODUCT_APPROVED]: ProductStatusChangeData;
  [EMAIL_TYPES.PRODUCT_REJECTED]: ProductStatusChangeData;

  [EMAIL_TYPES.PAYMENT_SUCCESS]: PaymentSuccessData;
  [EMAIL_TYPES.PAYMENT_FAILED]: PaymentFailedData;

  [EMAIL_TYPES.ORDER_CREATED_VENDOR]: VendorOrderCreatedData;
  [EMAIL_TYPES.ORDER_CONFIRMED_USER]: OrderConfirmedData;
  [EMAIL_TYPES.ORDER_DELIVERED_USER]: OrderDeliveredData;
  [EMAIL_TYPES.ORDER_CANCELLED_VENDOR]: OrderCancelledVendorData;
  [EMAIL_TYPES.ORDER_CANCELLED_USER]: OrderCancelledUserData;
  [EMAIL_TYPES.ORDER_REFUNDED_USER]: OrderRefundUserData;
  [EMAIL_TYPES.ORDER_REFUNDED_VENDOR]: OrderRefundVendorData;
}
