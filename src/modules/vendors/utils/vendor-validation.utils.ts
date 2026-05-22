import { BadRequestException, ConflictException } from "@nestjs/common";

import { ERROR_MESSAGES } from "../vendors.constants";

import type { UpdateVendorProfileDto } from "../dto/update-vendor-profile.dto";
import type { VendorProfileEntity } from "../vendor.profile.entity";

export function validateVendorProfileUpdatePayload(dto: UpdateVendorProfileDto): void {
  if (Object.keys(dto).length === 0) {
    throw new BadRequestException(ERROR_MESSAGES.NO_UPDATE_FIELDS_PROVIDED);
  }
}

export function validateVendorUniqueFields(
  dto: UpdateVendorProfileDto,
  existingVendor?: VendorProfileEntity | null,
): void {
  if (!existingVendor) {
    return;
  }

  if (dto.businessEmail && dto.businessEmail === existingVendor.businessEmail) {
    throw new ConflictException(ERROR_MESSAGES.BUSINESS_EMAIL_ALREADY_EXISTS);
  }

  if (dto.businessPhone && dto.businessPhone === existingVendor.businessPhone) {
    throw new ConflictException(ERROR_MESSAGES.BUSINESS_PHONE_ALREADY_EXISTS);
  }
}
