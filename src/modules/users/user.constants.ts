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

export enum UserSortByEnum {
  CREATED_AT = "createdAt",
  FIRST_NAME = "firstName",
  EMAIL = "email",
}
