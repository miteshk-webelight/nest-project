import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DatabaseModule } from "../database/database.module";
import { OrderItemEntity } from "../orders/entities/order-item.entity";
import { OrderEntity } from "../orders/entities/order.entity";
import { VendorOrderEntity } from "../orders/entities/vendor-order.entity";
import { ProductEntity } from "../products/product.entity";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";

import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      UsersEntity,
      ProductEntity,
      VendorProfileEntity,
      VendorOrderEntity,
      OrderItemEntity,
      OrderEntity,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
