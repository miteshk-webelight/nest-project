import { NotFoundException } from "@nestjs/common";

import { UserRoleEnum } from "../users/user.constants";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { ERROR_MESSAGES, ProductStatusEnum, ProductVisibilityEnum } from "./products.constants";

import type { ProductEntity } from "./product.entity";
import type { UsersEntity } from "../users/entity/users.entity";
import type { VendorProfileEntity } from "../vendors/vendor.profile.entity";

function isProductPubliclyVisible(product: ProductEntity): boolean {
  return (
    product.status === ProductStatusEnum.APPROVED &&
    product.isActive &&
    product.vendor.status === VendorStatusEnum.APPROVED
  );
}

export function resolveProductVisibility(
  product: ProductEntity,
  user?: UsersEntity,
  vendorProfile?: VendorProfileEntity,
): ProductVisibilityEnum {
  if (user?.role === UserRoleEnum.ADMIN) {
    return ProductVisibilityEnum.ADMIN;
  }

  if (user?.role === UserRoleEnum.VENDOR && vendorProfile?.id === product.vendorId) {
    return ProductVisibilityEnum.VENDOR_OWNER;
  }

  if (!isProductPubliclyVisible(product)) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  return ProductVisibilityEnum.PUBLIC;
}
