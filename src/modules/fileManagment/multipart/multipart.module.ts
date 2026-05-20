import { Module } from "@nestjs/common";

import { MultipartController } from "./multipart.controller";
import { MultiPartService } from "./multipart.service";

@Module({
  controllers: [MultipartController],
  providers: [MultiPartService],
  exports: [MultiPartService],
})
export class MultipartModule {}
