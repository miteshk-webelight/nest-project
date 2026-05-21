import { Global, Module } from "@nestjs/common";

import { RedisModule } from "../redis/redisModule";

import { RateLimitGuard } from "./guards/rate-limit.guard";

@Global()
@Module({
  imports: [RedisModule],
  providers: [RateLimitGuard],
  exports: [RateLimitGuard],
})
export class RateLimiterModule {}
