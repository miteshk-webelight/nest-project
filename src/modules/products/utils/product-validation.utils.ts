import { BadRequestException, ConflictException } from "@nestjs/common";

import { ERROR_MESSAGES, PRODUCT_SELECT_FIELDS, ProductStatusEnum } from "../products.constants";

import type { UpdateProductDto } from "../dto/update-product.dto";
import type { ProductEntity } from "../product.entity";
import type { ValidateProductUpdateParams } from "../product.types";
import type { Repository } from "typeorm";

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

export function validateSkuUniqueness(existingProduct: ProductEntity | null): void {
  if (existingProduct) {
    throw new ConflictException(ERROR_MESSAGES.SKU_ALREADY_EXISTS);
  }
}

export function validateUpdatePayload(dto: UpdateProductDto): void {
  const dtoKeys = Object.keys(dto) as (keyof UpdateProductDto)[];
  const hasUpdateFields = dtoKeys.length > 0;

  if (!hasUpdateFields) {
    throw new BadRequestException(ERROR_MESSAGES.INVALID_PRODUCT_UPDATE_PAYLOAD);
  }
}

export function validateProductActivation(isActive: boolean, currentStatus: ProductStatusEnum): void {
  if (isActive && currentStatus !== ProductStatusEnum.APPROVED) {
    throw new BadRequestException(ERROR_MESSAGES.PRODUCT_CANNOT_BE_MODIFIED);
  }
}

export async function validateSkuUniquenessForUpdate(
  newSku: string,
  productId: string,
  vendorId: string,
  productRepository: Repository<ProductEntity>,
): Promise<void> {
  const existingProduct = await productRepository
    .createQueryBuilder("product")
    .select(PRODUCT_SELECT_FIELDS.ID)
    .where("product.sku = :sku", { sku: newSku })
    .andWhere("product.vendorId = :vendorId", { vendorId })
    .andWhere("product.id != :productId", { productId })
    .getOne();

  if (existingProduct) {
    throw new ConflictException(ERROR_MESSAGES.SKU_ALREADY_EXISTS);
  }
}

export async function validateProductUpdate({
  dto,
  product,
  productId,
  vendorId,
  productRepository,
  validateCategoryExistsAndActive,
}: ValidateProductUpdateParams): Promise<void> {
  if (dto.categoryId !== undefined) {
    await validateCategoryExistsAndActive(dto.categoryId);
  }

  if (dto.price !== undefined || dto.discountPrice !== undefined) {
    validateProductPrice(dto.price ?? product.price, dto.discountPrice);
  }

  if (dto.sku !== undefined && dto.sku !== product.sku) {
    await validateSkuUniquenessForUpdate(dto.sku, productId, vendorId, productRepository);
  }

  if (dto.isActive !== undefined) {
    validateProductActivation(dto.isActive, product.status);
  }
}
