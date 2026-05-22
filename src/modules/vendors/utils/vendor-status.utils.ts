import { BadRequestException } from "@nestjs/common";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { VALID_VENDOR_STATUS_TRANSITIONS, VendorStatusEnum } from "../vendors.constants";

export const validateVendorStatusTransition = (currentStatus: VendorStatusEnum, nextStatus: VendorStatusEnum): void => {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions = VALID_VENDOR_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(nextStatus)) {
    throw new BadRequestException(`Invalid vendor status transition from ${currentStatus} to ${nextStatus}`);
  }
};
