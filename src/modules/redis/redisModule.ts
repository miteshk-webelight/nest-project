import { Module } from "@nestjs/common";

import Redis from "ioredis";

import { redisConfig } from "../../config/redis-config";

import { RedisService } from "./redis.service";

@Module({
  providers: [
    {
      provide: "REDIS_CLIENT",
      useValue: new Redis({
        ...redisConfig,
      }),
    },
    RedisService,
  ],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule {}
