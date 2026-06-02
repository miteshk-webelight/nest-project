import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { AuthEvents, type UserLoggedInEventPayload } from "src/modules/auth/constants/auth-events";
import { logger } from "src/services/logger.service";

import { CartsService } from "./carts.service";

@Injectable()
export class CartAuthEventsListener {
  constructor(private readonly cartsService: CartsService) {}

  @OnEvent(AuthEvents.USER_LOGGED_IN)
  async handleUserLoggedIn({ userId, guestToken, isNewUser }: UserLoggedInEventPayload): Promise<void> {
    try {
      await this.cartsService.mergeGuestCartToUser({
        userId,
        guestToken,
        isNewUser,
      });
    } catch (error) {
      logger.error("Error merging guest cart after login:", error);
    }
  }
}
