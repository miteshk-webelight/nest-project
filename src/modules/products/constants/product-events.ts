import { ProductStatusEnum } from "../products.constants";

export const ProductEvents = {
  PRODUCT_SUBMITTED_FOR_REVIEW: "product.submitted_for_review",
  PRODUCT_STATUS_CHANGED: "product.status_changed",
} as const;

export type ProductSubmittedForReviewPayload = {
  productId: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  adminEmail: string;
};

export type ProductStatusChangedPayload = {
  productId: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  oldStatus: ProductStatusEnum;
  newStatus: ProductStatusEnum;
};

export const PRODUCT_STATUS_EMAIL_TYPE_MAP: Partial<Record<ProductStatusEnum, string>> = {
  [ProductStatusEnum.APPROVED]: "product.approved",
  [ProductStatusEnum.REJECTED]: "product.rejected",
};
