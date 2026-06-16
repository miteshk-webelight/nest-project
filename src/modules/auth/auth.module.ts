import { Module } from "@nestjs/common";

import { RedisModule } from "../redis/redisModule";
import { UsersModule } from "../users/users.module";
import { UserSessionModule } from "../userSessions/userSession.module";
import { WorkersModule } from "../workers/workers.module";

import { AuthController } from "./auth.controller";
import { AuthHelperService } from "./auth.helper.service";
import { AuthService } from "./auth.service";
import { AuthEmailEventsListener } from "./listeners/auth-email-events.listener";

@Module({
  imports: [UsersModule, RedisModule, UserSessionModule, WorkersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthHelperService, AuthEmailEventsListener],
  exports: [AuthService],
})
export class AuthModule {}
