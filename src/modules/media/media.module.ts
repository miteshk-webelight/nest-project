import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaCleanupService } from "./media-cleanup.service";
import { MediaController } from "./media.controller";
import { MediaEntity } from "./media.entity";
import { MediaService } from "./media.service";

@Module({
  imports: [TypeOrmModule.forFeature([MediaEntity])],
  controllers: [MediaController],
  providers: [MediaService, MediaCleanupService],
  exports: [MediaService],
})
export class MediaModule {}
