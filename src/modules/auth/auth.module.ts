import { Module } from "@nestjs/common";

import { RedisModule } from "../redis/redisModule";
import { UsersModule } from "../users/users.module";
import { UserSessionModule } from "../userSessions/userSession.module";

import { AuthController } from "./auth.controller";
import { AuthHelperService } from "./auth.helper.service";
import { AuthService } from "./auth.service";

@Module({
  imports: [UsersModule, RedisModule, UserSessionModule],
  controllers: [AuthController],
  providers: [AuthService, AuthHelperService],
  exports: [AuthService],
})
export class AuthModule {}
