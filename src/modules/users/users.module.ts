import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RedisModule } from "../redis/redisModule";

import { AddressEntity } from "./entity/address.entity";
import { UsersEntity } from "./entity/users.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity, AddressEntity]), RedisModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
