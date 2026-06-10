import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DatabaseModule } from "../database/database.module";
import { MediaEntity } from "../media/media.entity";
import { MediaModule } from "../media/media.module";
import { OrderItemEntity } from "../orders/entities/order-item.entity";
import { OrdersModule } from "../orders/orders.module";
import { ProductEntity } from "../products/product.entity";
import { ProductsModule } from "../products/products.module";
import { UsersEntity } from "../users/entity/users.entity";
import { UsersModule } from "../users/users.module";

import { ReviewLikesEntity } from "./entities/likes.entity";
import { ReviewsEntity } from "./entities/reviews.entity";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    MediaModule,
    TypeOrmModule.forFeature([
      ReviewsEntity,
      ReviewLikesEntity,
      ProductEntity,
      OrderItemEntity,
      UsersEntity,
      MediaEntity,
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
