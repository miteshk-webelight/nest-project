import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserSessionEntity } from "./userSession.entity";
import { UserSessionService } from "./userSession.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserSessionEntity])],
  providers: [UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
