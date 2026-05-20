import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { throttlerConfig } from "./config/throttle.config";
import { AuthGuard } from "./guards/auth-guard";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { DatabaseModule } from "./modules/database/database.module";
import { FileManagementModule } from "./modules/fileManagment/fileManagment.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [DatabaseModule, AuthModule, FileManagementModule, ThrottlerModule.forRoot(throttlerConfig), UsersModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
