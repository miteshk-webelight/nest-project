import { BadRequestException, ConflictException } from "@nestjs/common";

import { ERROR_MESSAGES } from "../categories.constants";

import type { CategoryEntity } from "../category.entity";
import type { UpdateCategoryDto } from "../dto/update-category.dto";

export function validateCategoryUpdatePayload(dto: UpdateCategoryDto): void {
  if (Object.keys(dto).length === 0) {
    throw new BadRequestException(ERROR_MESSAGES.INVALID_CATEGORY_UPDATE_PAYLOAD);
  }
}

export function validateCategoryUniqueFields(dto: UpdateCategoryDto, existingCategory: CategoryEntity | null): void {
  if (!existingCategory) {
    return;
  }

  if (dto.name?.toLowerCase() === existingCategory.name.toLowerCase()) {
    throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
  }
}

export function validateCategoryActivationTransition(currentStatus: boolean, newStatus: boolean): void {
  if (currentStatus === newStatus) {
    throw new ConflictException(
      currentStatus ? ERROR_MESSAGES.CATEGORY_ALREADY_ACTIVE : ERROR_MESSAGES.CATEGORY_ALREADY_INACTIVE,
    );
  }
}
