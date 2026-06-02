import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OptionalAuthGuard } from "src/guards/optional-auth.guard";

import { DatabaseModule } from "../database/database.module";
import { ProductEntity } from "../products/product.entity";
import { RedisModule } from "../redis/redisModule";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";

import { CartAuthEventsListener } from "./cart-auth-events.listener";
import { CartCleanupService } from "./cart-cleanup-service";
import { CartsController } from "./carts.controller";
import { CartsService } from "./carts.service";
import { CartItemEntity } from "./entities/cart-items.entity";
import { CartEntity } from "./entities/carts.entity";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    TypeOrmModule.forFeature([CartEntity, CartItemEntity, ProductEntity, VendorProfileEntity]),
  ],
  controllers: [CartsController],
  exports: [CartsService],
  providers: [CartsService, CartAuthEventsListener, OptionalAuthGuard, CartCleanupService],
})
export class CartsModule {}
