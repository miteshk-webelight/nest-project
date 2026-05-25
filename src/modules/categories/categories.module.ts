import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DatabaseModule } from "../database/database.module";
import { RedisModule } from "../redis/redisModule";
import { UsersEntity } from "../users/entity/users.entity";

import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { CategoryEntity } from "./category.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, UsersEntity]), RedisModule, DatabaseModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
