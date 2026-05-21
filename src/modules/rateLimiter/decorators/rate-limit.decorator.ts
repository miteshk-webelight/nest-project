import { SetMetadata } from "@nestjs/common";

import { RATE_LIMIT_KEY } from "../constants/rate-limiter.constants";

export const RateLimit = (limit: number, ttl: number): MethodDecorator =>
  SetMetadata(RATE_LIMIT_KEY, {
    limit,
    ttl,
  });
