import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersEntity } from "../users/entity/users.entity";

import { VendorProfileEntity } from "./vendor.profile.entity";
import { VendorsController } from "./vendors.controller";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [TypeOrmModule.forFeature([VendorProfileEntity, UsersEntity])],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
