import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaEntity } from "./media.entity";
import { MediaService } from "./media.service";

@Module({
  imports: [TypeOrmModule.forFeature([MediaEntity])],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
