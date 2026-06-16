import { VendorStatusEnum } from "../vendors.constants";

export const VendorEvents = {
  VENDOR_REGISTERED: "vendor.registered",
  VENDOR_APPROVED: "vendor.approved",
  VENDOR_REJECTED: "vendor.rejected",
  VENDOR_SUSPENDED: "vendor.suspended",
  VENDOR_DELETED: "vendor.deleted",
} as const;

export type VendorRegisteredEventPayload = {
  vendorId: string;
  businessName: string;
  businessEmail: string;
  ownerEmail: string;
  ownerFirstName: string;
  adminEmail: string;
};

export type VendorStatusChangedEventPayload = {
  vendorId: string;
  businessName: string;
  businessEmail: string;
  ownerEmail: string;
  ownerFirstName: string;
};

export type VendorDeletedEventPayload = {
  vendorId: string;
  businessName: string;
  businessEmail: string;
  ownerEmail: string;
  ownerFirstName: string;
};

export const VENDOR_STATUS_EVENT_MAP = {
  [VendorStatusEnum.APPROVED]: VendorEvents.VENDOR_APPROVED,
  [VendorStatusEnum.REJECTED]: VendorEvents.VENDOR_REJECTED,
  [VendorStatusEnum.SUSPENDED]: VendorEvents.VENDOR_SUSPENDED,
} as const;
