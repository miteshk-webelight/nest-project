import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersEntity } from "../users/entity/users.entity";
import { WorkersModule } from "../workers/workers.module";

import { VendorEmailEventsListener } from "./listeners/vendor-email-events.listener";
import { VendorProfileEntity } from "./vendor.profile.entity";
import { VendorsController } from "./vendors.controller";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [TypeOrmModule.forFeature([VendorProfileEntity, UsersEntity]), WorkersModule],
  controllers: [VendorsController],
  providers: [VendorsService, VendorEmailEventsListener],
  exports: [VendorsService],
})
export class VendorsModule {}
