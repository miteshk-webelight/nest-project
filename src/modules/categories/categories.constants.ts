export const CATEGORY_CACHE_TTL = 300;

export const ERROR_MESSAGES = {
  CATEGORY_NOT_FOUND: "Category not found",
  CATEGORY_ALREADY_EXISTS: "Category already exists",
  CATEGORY_ALREADY_ACTIVE: "Category is already active",
  CATEGORY_ALREADY_INACTIVE: "Category is already inactive",
  INVALID_CATEGORY_UPDATE_PAYLOAD: "Please provide at least one field to update",
  CATEGORY_LINKED_WITH_PRODUCTS: "Category cannot be deleted because it is linked with products",
};

export const SUCCESS_MESSAGES = {
  CATEGORY_CREATED_SUCCESS: "Category created successfully",
  CATEGORY_UPDATED_SUCCESS: "Category updated successfully",
  CATEGORY_DELETED_SUCCESS: "Category deleted successfully",
  CATEGORY_ACTIVATED_SUCCESS: "Category activated successfully",
  CATEGORY_DEACTIVATED_SUCCESS: "Category deactivated successfully",
};

export const CATEGORY_SELECT_FIELDS = {
  DETAILS: [
    "category.id",
    "category.name",
    "category.slug",
    "category.description",
    "category.isActive",
    "category.createdBy",
    "category.updatedBy",
    "category.createdAt",
    "category.updatedAt",
  ],
  LIST: [
    "category.id",
    "category.name",
    "category.slug",
    "category.description",
    "category.isActive",
    "category.createdAt",
  ],
  MAIN: ["category.id", "category.slug", "category.isActive", "category.name"],
};
