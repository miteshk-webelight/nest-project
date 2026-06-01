import { Controller, Post, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { ApiTag } from "src/constants/api-tags.constants";
import { Public } from "src/decorators/public.decorator";
import { logger } from "src/services/logger.service";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { RateLimit } from "../rateLimiter/decorators/rate-limit.decorator";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";

import { CartsService } from "./carts.service";
import { GuestSessionResponse } from "./response/guest-session.response";

import type { Response } from "express";

@ApiTags(ApiTag.Carts)
@Controller("carts")
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @ApiSwaggerResponse(GuestSessionResponse)
  @Public()
  @RateLimit(20, 60)
  @Post("guest-session")
  generateGuestSession(@Res() res: Response): Response<CommonResponseType<GuestSessionResponse>> {
    try {
      const guestSession = this.cartsService.generateGuestToken();

      return responseUtils.success(res, {
        data: guestSession,
        status: StatusCodes.OK,
        transformWith: GuestSessionResponse,
      });
    } catch (error) {
      logger.error("Error generating guest session:", error);

      return responseUtils.error({
        res,
        error,
      });
    }
  }
}
