import { BadRequestException } from "@nestjs/common";

import { ERROR_MESSAGES, GUEST_TOKEN_PREFIX } from "../carts.constants";

import type { CartOwner } from "../carts.types";

export const validateGuestToken = (guestToken?: string): string => {
  if (!guestToken) {
    throw new BadRequestException(ERROR_MESSAGES.MISSING_GUEST_TOKEN);
  }

  if (!guestToken.startsWith(`${GUEST_TOKEN_PREFIX}_`)) {
    throw new BadRequestException(ERROR_MESSAGES.INVALID_GUEST_TOKEN);
  }

  return guestToken;
};

export const resolveCartOwner = ({ user, guestToken }: CartOwner): { userId?: string; guestToken?: string } => {
  if (user) {
    return { userId: user.id };
  }

  return { guestToken: validateGuestToken(guestToken) };
};

export const validateStock = ({ requestedQuantity, stock }: { requestedQuantity: number; stock: number }): void => {
  if (requestedQuantity > stock) {
    throw new BadRequestException(ERROR_MESSAGES.INSUFFICIENT_STOCK);
  }
};
