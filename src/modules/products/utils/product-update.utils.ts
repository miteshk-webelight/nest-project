import { generateSlug } from "src/utils/helper.utils";

import { ProductStatusEnum } from "../products.constants";

import type { UpdateProductDto } from "../dto/update-product.dto";
import type { ProductEntity } from "../product.entity";

function applyReviewStateUpdate(product: ProductEntity, reviewRequired: boolean): void {
  if (!reviewRequired) {
    return;
  }

  if (product.status === ProductStatusEnum.DRAFT) {
    return;
  }

  product.status = ProductStatusEnum.PENDING;
  product.isActive = false;
  product.reviewedBy = undefined;
  product.reviewedAt = undefined;
}

function applyFieldUpdates(dto: UpdateProductDto, product: ProductEntity, reviewRequired: boolean): void {
  if (dto.name !== undefined) {
    product.slug = generateSlug(dto.name, true);
    product.name = dto.name;
  }

  if (dto.description !== undefined) {
    product.description = dto.description;
  }

  if (dto.categoryId !== undefined) {
    product.categoryId = dto.categoryId;
  }

  if (dto.sku !== undefined) {
    product.sku = dto.sku;
  }

  if (dto.price !== undefined) {
    product.price = dto.price;
  }

  if (dto.discountPrice !== undefined) {
    product.discountPrice = dto.discountPrice;
  }

  if (dto.stock !== undefined) {
    product.stock = dto.stock;
  }

  if (dto.isActive !== undefined && !reviewRequired) {
    product.isActive = dto.isActive;
  }
}

function isReviewRequired(dto: UpdateProductDto): boolean {
  return (
    dto.name !== undefined ||
    dto.description !== undefined ||
    dto.categoryId !== undefined ||
    dto.removedMediaIds !== undefined ||
    dto.newMediaIds !== undefined
  );
}

export function applyProductUpdates(dto: UpdateProductDto, product: ProductEntity): void {
  const reviewRequired = isReviewRequired(dto);

  applyReviewStateUpdate(product, reviewRequired);
  applyFieldUpdates(dto, product, reviewRequired);
}
