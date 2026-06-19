import { ProductVisibilityEnum } from "./products.constants";

import type { ProductEntity } from "./product.entity";
import type { ProductAdminResponse, ProductPublicResponse, ProductVendorResponse } from "./product.response";
import type { MediaEntity } from "../media/media.entity";
import type { MediaResponse } from "../media/media.response";

export type ProductDetailsResponse = ProductAdminResponse | ProductVendorResponse | ProductPublicResponse;

function serializeMedia(mediaItems: MediaEntity[]): MediaResponse[] {
  return mediaItems.map(({ id, filePath, filename, mimeType, size, createdAt }) => ({
    id,
    filePath,
    filename,
    mimeType,
    size,
    createdAt,
  }));
}

function getBaseFields(product: ProductEntity, media: MediaEntity[]): Partial<ProductAdminResponse> {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    discountPrice: product.discountPrice,
    media: serializeMedia(media),
    vendor: {
      id: product.vendor.id,
      storeName: product.vendor.businessName,
    },
    averageRating: Number(product.averageRating) || 0,
    reviewCount: product.reviewCount || 0,
  };
}

function getInternalFields(product: ProductEntity): Partial<ProductAdminResponse> {
  return {
    vendorId: product.vendorId,
    sku: product.sku,
    stock: product.stock,
    status: product.status,
    isActive: product.isActive,
    reviewedAt: product.reviewedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function getAdminFields(product: ProductEntity): Partial<ProductAdminResponse> {
  return {
    reviewedBy: product.reviewedBy,
    createdBy: product.createdBy,
    updatedBy: product.updatedBy,
  };
}

function getPublicFields(product: ProductEntity): Partial<ProductPublicResponse> {
  return {
    isOutOfStock: product.stock <= 0,
  };
}

export function serializeProductByVisibility(
  product: ProductEntity,
  media: MediaEntity[],
  visibility: ProductVisibilityEnum,
): ProductDetailsResponse {
  const response: Partial<ProductAdminResponse> = {
    ...getBaseFields(product, media),
  };

  if (visibility !== ProductVisibilityEnum.PUBLIC) {
    Object.assign(response, getInternalFields(product));
  }

  if (visibility === ProductVisibilityEnum.ADMIN) {
    Object.assign(response, getAdminFields(product));
  }

  if (visibility === ProductVisibilityEnum.PUBLIC) {
    Object.assign(response, getPublicFields(product));
  }

  return response as ProductDetailsResponse;
}
