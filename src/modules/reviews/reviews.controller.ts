import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { ApiTag } from "src/constants/api-tags.constants";
import { CurrentUser } from "src/decorators/current-user.decorator";
import { RoleGuard } from "src/guards/role-guard";
import { RateLimit } from "src/modules/rateLimiter/decorators/rate-limit.decorator";
import { UserRoleEnum } from "src/modules/users/user.constants";
import { logger } from "src/services/logger.service";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { MessageResponse } from "../swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";

import { CreateReviewDto } from "./dto/create-review.dto";
import { GetReviewsByProductDto } from "./dto/get-reviews-by-product.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { ReviewResponse } from "./responses/review.response";
import { ReviewsListResponse } from "./responses/reviews-list.response";
import { SUCCESS_MESSAGES } from "./reviews.constants";
import { ReviewsService } from "./reviews.service";

import type { Response } from "express";

@ApiTags(ApiTag.Reviews)
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiSwaggerResponse(ReviewResponse)
  @Post()
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @RateLimit(10, 60)
  async createReview(
    @CurrentUser("id") userId: string,
    @Res() res: Response,
    @Body() dto: CreateReviewDto,
  ): Promise<Response<CommonResponseType<ReviewResponse>>> {
    try {
      const review = await this.reviewsService.createReview(userId, dto);

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

  @ApiSwaggerResponse(ReviewsListResponse)
  @Get("product")
  @UseGuards(RoleGuard(UserRoleEnum.USER, UserRoleEnum.ADMIN, UserRoleEnum.VENDOR))
  @RateLimit(60, 60)
  async getReviewsByProduct(
    @Query() query: GetReviewsByProductDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<ReviewsListResponse>>> {
    try {
      const reviews = await this.reviewsService.getReviewsByProduct(query);

      return responseUtils.success(res, {
        data: reviews,
        status: StatusCodes.OK,
        transformWith: ReviewsListResponse,
      });
    } catch (error) {
      logger.error("Error getting reviews by product:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.OK })
  @Patch(":id")
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @RateLimit(20, 60)
  async updateReview(
    @CurrentUser("id") userId: string,
    @Res() res: Response,
    @Param("id") id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.reviewsService.updateReview(userId, id, dto);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.REVIEW_UPDATED,
        },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error updating review:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.OK })
  @Delete(":id")
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @RateLimit(20, 60)
  async deleteReview(
    @CurrentUser("id") userId: string,
    @Res() res: Response,
    @Param("id") id: string,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.reviewsService.deleteReview(userId, id);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.REVIEW_DELETED,
        },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error Deleting review:", error);
      return responseUtils.error({ res, error });
    }
  }
}
