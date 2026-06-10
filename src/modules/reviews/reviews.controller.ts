import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { ApiTag } from "src/constants/api-tags.constants";
import { RoleGuard } from "src/guards/role-guard";
import { RateLimit } from "src/modules/rateLimiter/decorators/rate-limit.decorator";
import { UserRoleEnum } from "src/modules/users/user.constants";
import { logger } from "src/services/logger.service";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewResponse } from "./responses/review.response";
import { ReviewsService } from "./reviews.service";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Reviews)
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @RateLimit(10, 60)
  async createReview(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateReviewDto,
  ): Promise<Response<CommonResponseType<ReviewResponse>>> {
    try {
      const review = await this.reviewsService.createReview(req.user.id, dto);

      return responseUtils.success(res, {
        data: review,
        status: StatusCodes.CREATED,
        transformWith: ReviewResponse,
      });
    } catch (error) {
      logger.error("Error creating review:", error);
      return responseUtils.error({ res, error });
    }
  }
}
