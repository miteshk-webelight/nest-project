import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OptionalAuthGuard } from "src/guards/optional-auth.guard";

import { CategoryEntity } from "../categories/category.entity";
import { DatabaseModule } from "../database/database.module";
import { MediaModule } from "../media/media.module";
import { RedisModule } from "../redis/redisModule";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";

import { ProductEntity } from "./product.entity";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, CategoryEntity, UsersEntity, VendorProfileEntity]),
    RedisModule,
    DatabaseModule,
    MediaModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, OptionalAuthGuard],
  exports: [ProductsService],
})
export class ProductsModule {}
