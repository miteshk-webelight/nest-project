import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AddressEntity } from "./address.entity";
import { UsersController } from "./users.controller";
import { UsersEntity } from "./users.entity";
import { UsersService } from "./users.service";
import { VendorProfileEntity } from "./vendor.profile.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity, AddressEntity, VendorProfileEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
