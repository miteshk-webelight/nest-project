import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RedisService } from "../../redis/redis.service";
import { RATE_LIMIT_KEY } from "../constants/rate-limiter.constants";
import { RateLimitOptions } from "../decorators/rate-limit.decorator";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const ip = request.headers["x-forwarded-for"] ?? request.ip ?? request.socket.remoteAddress ?? "unknown";

    const key = `rate-limit:${ip}:${context.getHandler().name}`;

    /**
     * increment FIRST
     */
    const currentCount = await this.redisService.increment(key);

    /**
     * set expiry only on first request
     */
    if (currentCount === 1) {
      await this.redisService.expire(key, options.ttl);
    }

    /**
     * block if limit exceeded
     */
    if (currentCount > options.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: "Too many requests. Try again later.",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
