import { BadRequestException, ConflictException } from "@nestjs/common";

import { ERROR_MESSAGES, ProductStatusEnum } from "../products.constants";

import type { ProductEntity } from "../product.entity";

// After update product endpoint
// export function validateProductUpdatePayload(dto: UpdateProductDto): void {
//   if (Object.keys(dto).length === 0) {
//     throw new BadRequestException(ERROR_MESSAGES.INVALID_PRODUCT_UPDATE_PAYLOAD);
//   }
// }

export function validateProductPrice(price: number, discountPrice?: number): void {
  if (discountPrice && discountPrice >= price) {
    throw new BadRequestException(ERROR_MESSAGES.INVALID_DISCOUNT_PRICE);
  }
}

export function validateProductStatusTransition(currentStatus: ProductStatusEnum, newStatus: ProductStatusEnum): void {
  const validTransitions = {
    [ProductStatusEnum.DRAFT]: [ProductStatusEnum.PENDING],
    [ProductStatusEnum.PENDING]: [ProductStatusEnum.APPROVED, ProductStatusEnum.REJECTED],
    [ProductStatusEnum.APPROVED]: [ProductStatusEnum.SUSPENDED],
    [ProductStatusEnum.SUSPENDED]: [ProductStatusEnum.APPROVED],
    [ProductStatusEnum.REJECTED]: [ProductStatusEnum.PENDING],
  };

  const allowedTransitions = validTransitions[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    throw new ConflictException(ERROR_MESSAGES.INVALID_PRODUCT_STATUS_TRANSITION);
  }
}

// After update product endpoint
// export function requiresNewApproval(dto: UpdateProductDto): boolean {
//   const fieldsRequiringApproval = ["name", "description", "categoryId"];

//   return fieldsRequiringApproval.some((field) => dto[field] !== undefined);
// }

export function validateSkuUniqueness(existingProduct: ProductEntity | null): void {
  if (existingProduct) {
    throw new ConflictException(ERROR_MESSAGES.SKU_ALREADY_EXISTS);
  }
}
