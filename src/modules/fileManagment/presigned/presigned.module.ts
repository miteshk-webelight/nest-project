import { Module } from "@nestjs/common";

import { PresignedController } from "./presigned.controller";
import { PresignedService } from "./presigned.service";

@Module({
  controllers: [PresignedController],
  providers: [PresignedService],
  exports: [PresignedService],
})
export class PreSignedModule {}
