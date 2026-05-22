export const VENDOR_CACHE_TTL = 300;

export enum VendorStatusEnum {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export const ERROR_MESSAGES = {
  VENDOR_APPLICATION_ALREADY_EXISTS: "Vendor application already exists",
  VENDOR_APPLICATION_NOT_FOUND: "Vendor application not found",
  USER_NOT_FOUND: "User not found",
  BUSINESS_EMAIL_ALREADY_EXISTS: "Business email already exists",
  BUSINESS_PHONE_ALREADY_EXISTS: "Business phone already exists",
  NO_UPDATE_FIELDS_PROVIDED: "Please provide at least one field to update",
};

export const SUCCESS_MESSAGES = {
  VENDOR_APPLICATION_SUBMITTED: "Vendor application submitted successfully",
  VENDOR_APPLICATION_UPDATED: "Vendor application updated successfully",
  VENDOR_PROFILE_UPDATED: "Vendor Profile updated successfully",
  VENDOR_DELETED_SUCCESS: "Vendor Profile deleted successfully",
};

export const VALID_VENDOR_STATUS_TRANSITIONS: Record<VendorStatusEnum, VendorStatusEnum[]> = {
  // Pending -> Approved or Rejected
  [VendorStatusEnum.PENDING]: [VendorStatusEnum.APPROVED, VendorStatusEnum.REJECTED],

  // Approved -> Suspended
  [VendorStatusEnum.APPROVED]: [VendorStatusEnum.SUSPENDED],

  // Suspended -> Approved
  [VendorStatusEnum.SUSPENDED]: [VendorStatusEnum.APPROVED],

  // Rejected ->  Can't update status
  [VendorStatusEnum.REJECTED]: [],
};

export const VENDOR_PROFILE_SELECT_FIELDS = [
  "vendor.id",
  "vendor.userId",
  "vendor.businessName",
  "vendor.businessEmail",
  "vendor.businessPhone",
  "vendor.businessAddress",
  "vendor.logoUrl",
  "vendor.description",
  "vendor.status",
  "vendor.approvedBy",
  "vendor.approvedAt",
  "vendor.createdAt",
  "vendor.updatedAt",
];

export const VENDOR_STATUS_SELECT_FIELDS = ["vendor.id", "vendor.userId", "vendor.status"];
export const VENDOR_STATUS_UPDATE_SELECT_FIELDS = [
  "vendor.id",
  "vendor.userId",
  "vendor.status",
  "vendor.approvedBy",
  "vendor.approvedAt",
];
