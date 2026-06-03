export enum UserRoleEnum {
  ADMIN = "ADMIN",
  USER = "USER",
  VENDOR = "VENDOR",
}

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User already exists",
  ADMIN_ONLY: "Only admin users can perform this action",
  USER_ALREADY_ACTIVE: "User is already active",
  PHONE_NUMBER_ALREADY_EXISTS: "Phone number already exists",
  INVALID_SORT_FIELD: "Invalid sort field for user listing",
  NO_UPDATE_FIELDS_PROVIDED: "Please provide at least one field to update",
  USER_LINKED_WITH_VENDOR_PROFILE: "User cannot be deleted because it is linked with a vendor profile",
  ADDRESS_NOT_FOUND: "Address not found for the current user.",
};

export const SUCCESS_MESSAGES = {
  USER_CREATED_SUCCESS: "User created successfully",
  ADMIN_CREATED_SUCCESS: "Admin created successfully",
  USER_UPDATED_SUCCESS: "User updated successfully",
  USER_DELETED_SUCCESS: "User deleted successfully",
  USER_RESTORED_SUCCESS: "User restored successfully",
};

export const USER_DETAILS_SELECT_FIELDS = [
  "user.id",
  "user.firstName",
  "user.lastName",
  "user.email",
  "user.phoneNumber",
  "user.avatarUrl",
  "user.role",
  "user.isEmailVerified",
  "user.deletedAt",
  "user.createdAt",
  "user.updatedAt",

  // vendor profile fields
  "vendorProfiles.id",
  "vendorProfiles.businessName",
  "vendorProfiles.businessEmail",
  "vendorProfiles.businessPhone",
  "vendorProfiles.businessAddress",
  "vendorProfiles.logoUrl",
  "vendorProfiles.description",
  "vendorProfiles.status",
  "vendorProfiles.approvedBy",
  "vendorProfiles.createdAt",
];

export const USER_LIST_SELECT_FIELDS = [
  "user.id",
  "user.firstName",
  "user.lastName",
  "user.email",
  "user.phoneNumber",
  "user.role",
  "user.createdAt",
];

export const ADDRESS_SELECT_FIELDS = [
  "addresses.id",
  "addresses.createdAt",
  "addresses.updatedAt",
  "addresses.createdBy",
  "addresses.fullName",
  "addresses.phoneNumber",
  "addresses.addressLine1",
  "addresses.addressLine2",
  "addresses.city",
  "addresses.postalCode",
  "addresses.country",
  "addresses.state",
];

export enum UserSortByEnum {
  CREATED_AT = "createdAt",
  FIRST_NAME = "firstName",
  EMAIL = "email",
}

export const ADDRESS_SUCCESS_MESSAGES = {
  ADDRESS_ADDED_SUCCESS: "Address validated and added successfully to user profile",
};

export const ADDRESS_ERROR_MESSAGES = {
  POSTAL_SERVICE_ERROR: "Postal validation temporary offline. Please try again later.",
  ADDRESS_MISMATCH: (postalCode: string, district: string, state: string): string =>
    `Address mismatch. Postal code '${postalCode}' belongs to District: ${district}, State: ${state}.`,
  POSTAL_CODE_NOT_EXISTS: (postalCode: string): string =>
    `The provided Postal code '${postalCode}' is invalid or does not exist.`,
};

export const POSTAL_VERIFICATION_URL = (postalCode: string): string =>
  `https://api.postalpincode.in/pincode/${postalCode}`;
