import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";

import { ClsModule } from "nestjs-cls";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { clsConfig } from "./config/cls.config";
import { throttlerConfig } from "./config/throttle.config";
import { AuthGuard } from "./guards/auth-guard";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CartsModule } from "./modules/carts/carts.module";
import { CartsService } from "./modules/carts/carts.service";
import { CategoriesModule } from "./modules/categories/categories.module";
import { DatabaseModule } from "./modules/database/database.module";
import { EmailModule } from "./modules/email/email.module";
import { FileManagementModule } from "./modules/fileManagment/fileManagment.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ProductsModule } from "./modules/products/products.module";
import { RateLimitGuard } from "./modules/rateLimiter/guards/rate-limit.guard";
import { RateLimiterModule } from "./modules/rateLimiter/rate-limiter.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { UsersModule } from "./modules/users/users.module";
import { VendorsModule } from "./modules/vendors/vendors.module";

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    FileManagementModule,
    ThrottlerModule.forRoot(throttlerConfig),
    UsersModule,
    RateLimiterModule,
    VendorsModule,
    CategoriesModule,
    ClsModule.forRoot(clsConfig),
    ProductsModule,
    ScheduleModule.forRoot(),
    CartsModule,
    PaymentsModule,
    OrdersModule,
    AnalyticsModule,
    EmailModule,
    ReviewsModule,
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
    CartsService,
  ],
})
export class AppModule {}
