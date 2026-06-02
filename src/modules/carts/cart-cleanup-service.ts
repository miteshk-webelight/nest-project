import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { logger } from "src/services/logger.service";

import { DatabaseService } from "../database/database.service";

import { CART_CLEANUP_CRON, CART_INACTIVE_DAYS, CART_SELECT_FIELDS } from "./carts.constants";
import { CartEntity } from "./entities/carts.entity";

@Injectable()
export class CartCleanupService {
  constructor(private readonly databaseService: DatabaseService) {}

  @Cron(CART_CLEANUP_CRON)
  async orphanCartCleanup(): Promise<void> {
    try {
      logger.info(" Started cleaning Inactive Carts...");
      await this.cleanupInactiveGuestCarts();
      await this.cleanupInactiveEmptyUserCarts();
    } catch (error) {
      logger.error("Error during cart cleanup:", error);
    }
  }

  private async cleanupInactiveGuestCarts(): Promise<void> {
    const cutoffDate = this.getCutoffDate();

    const cartRepository = this.databaseService.getRepository(CartEntity);

    const carts = await cartRepository
      .createQueryBuilder("cart")
      .select(CART_SELECT_FIELDS.CART_ID)
      .where("cart.updatedAt < :cutoffDate", { cutoffDate })
      .andWhere("cart.userId IS NULL")
      .andWhere("cart.guestToken IS NOT NULL")
      .getMany();

    if (!carts.length) {
      return;
    }

    const cartIds = carts.map((cart) => cart.id);

    await cartRepository
      .createQueryBuilder()
      .delete()
      .from(CartEntity)
      .where("id IN (:...cartIds)", { cartIds })
      .execute();

    logger.info(`Cleaned ${cartIds.length} inactive guest carts.`);
  }

  private async cleanupInactiveEmptyUserCarts(): Promise<void> {
    const cutoffDate = this.getCutoffDate();

    const cartRepository = this.databaseService.getRepository(CartEntity);

    const carts = await cartRepository
      .createQueryBuilder("cart")
      .leftJoin("cart.cartItems", "cartItem")
      .select(CART_SELECT_FIELDS.CART_ID)
      .where("cart.updatedAt < :cutoffDate", { cutoffDate })
      .andWhere("cart.userId IS NOT NULL")
      .andWhere("cartItem.id IS NULL")
      .getMany();

    if (!carts.length) {
      return;
    }

    const cartIds = carts.map((cart) => cart.id);

    await cartRepository
      .createQueryBuilder()
      .delete()
      .from(CartEntity)
      .where("id IN (:...cartIds)", { cartIds })
      .execute();

    logger.info(`Cleaned ${cartIds.length} inactive empty user carts.`);
  }

  private getCutoffDate(): Date {
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - CART_INACTIVE_DAYS);

    return cutoffDate;
  }
}
