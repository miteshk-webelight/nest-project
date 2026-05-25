import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { ClsModule } from "nestjs-cls";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { clsConfig } from "./config/cls.config";
import { throttlerConfig } from "./config/throttle.config";
import { AuthGuard } from "./guards/auth-guard";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { DatabaseModule } from "./modules/database/database.module";
import { FileManagementModule } from "./modules/fileManagment/fileManagment.module";
import { RateLimitGuard } from "./modules/rateLimiter/guards/rate-limit.guard";
import { RateLimiterModule } from "./modules/rateLimiter/rate-limiter.module";
import { UsersModule } from "./modules/users/users.module";
import { VendorsModule } from "./modules/vendors/vendors.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    FileManagementModule,
    ThrottlerModule.forRoot(throttlerConfig),
    UsersModule,
    RateLimiterModule,
    VendorsModule,
    CategoriesModule,
    ClsModule.forRoot(clsConfig),
  ],
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
