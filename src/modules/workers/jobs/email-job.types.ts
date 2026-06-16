import type { EMAIL_TYPES } from "../../email/constants/email-types.constants";
import type { AuthWelcomeData } from "../../email/templates/auth.templates";
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
}
