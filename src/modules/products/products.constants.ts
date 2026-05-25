export const PRODUCT_CACHE_TTL = 300;

export enum ProductStatusEnum {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export const VALID_PRODUCT_STATUS_TRANSITIONS: Record<ProductStatusEnum, ProductStatusEnum[]> = {
  [ProductStatusEnum.DRAFT]: [ProductStatusEnum.PENDING],
  [ProductStatusEnum.PENDING]: [ProductStatusEnum.APPROVED, ProductStatusEnum.REJECTED],
  [ProductStatusEnum.APPROVED]: [ProductStatusEnum.SUSPENDED],
  [ProductStatusEnum.SUSPENDED]: [ProductStatusEnum.APPROVED],
  [ProductStatusEnum.REJECTED]: [ProductStatusEnum.PENDING],
};

export const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_ALREADY_EXISTS: "Product already exists",
  SKU_ALREADY_EXISTS: "SKU already exists for this vendor",
  CATEGORY_NOT_FOUND: "Category not found",
  CATEGORY_NOT_ACTIVE: "Category is not active",
  VENDOR_NOT_APPROVED: "Vendor must be approved to create products",
  PRODUCT_ALREADY_APPROVED: "Product is already approved",
  PRODUCT_ALREADY_REJECTED: "Product is already rejected",
  PRODUCT_ALREADY_SUSPENDED: "Product is already suspended",
  PRODUCT_ALREADY_PENDING: "Product is already pending approval",
  PRODUCT_ALREADY_ACTIVE: "Product is already active",
  PRODUCT_ALREADY_INACTIVE: "Product is already inactive",
  PRODUCT_CANNOT_BE_MODIFIED: "Product cannot be modified in current status",
  INVALID_PRODUCT_UPDATE_PAYLOAD: "Please provide at least one field to update",
  INVALID_PRICE_VALUE: "Price must be greater than 0",
  INVALID_DISCOUNT_PRICE: "Discount price must be less than regular price",
  INVALID_STOCK_VALUE: "Stock must be greater than or equal to 0",
  INVALID_IMAGES_COUNT: "Product must have between 1 and 5 images",
  CATEGORY_LINKED_WITH_PRODUCTS: "Category cannot be deleted because it contains products",
  VENDOR_PROFILE_NOT_FOUND: "Vendor profile not found for the user",
};

export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED_SUCCESS: "Product created successfully",
  PRODUCT_UPDATED_SUCCESS: "Product updated successfully",
  PRODUCT_DELETED_SUCCESS: "Product deleted successfully",
  PRODUCT_SUBMITTED_SUCCESS: "Product submitted for approval",
  PRODUCT_APPROVED_SUCCESS: "Product approved successfully",
  PRODUCT_REJECTED_SUCCESS: "Product rejected successfully",
  PRODUCT_SUSPENDED_SUCCESS: "Product suspended successfully",
  PRODUCT_ACTIVATED_SUCCESS: "Product activated successfully",
  PRODUCT_DEACTIVATED_SUCCESS: "Product deactivated successfully",
};
