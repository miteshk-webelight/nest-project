import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { ApiTag } from "src/constants/api-tags.constants";
import { VendorStatus } from "src/decorators/vendor-status.decorator";
import { RoleGuard } from "src/guards/role-guard";
import { VendorStatusGuard } from "src/guards/vendor-status.guard";
import { logger } from "src/services/logger.service";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { RateLimit } from "../rateLimiter/decorators/rate-limit.decorator";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";
import { UserRoleEnum } from "../users/user.constants";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { AnalyticsService } from "./analytics.service";
import { AdminAnalyticsResponse } from "./responses/admin-analytics.response";
import { VendorAnalyticsResponse } from "./responses/vendor-analytics.response";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Analytics)
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiSwaggerResponse(AdminAnalyticsResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(60, 60)
  @Get("admin")
  async getAdminAnalytics(@Res() res: Response): Promise<Response<CommonResponseType<AdminAnalyticsResponse>>> {
    try {
      const data = await this.analyticsService.getAdminAnalytics();

      return responseUtils.success(res, {
        data,
        status: StatusCodes.OK,
        transformWith: AdminAnalyticsResponse,
      });
    } catch (error) {
      logger.error("Error Admin Analytics:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(VendorAnalyticsResponse)
  @UseGuards(RoleGuard(UserRoleEnum.VENDOR), VendorStatusGuard)
  @VendorStatus(VendorStatusEnum.APPROVED)
  @RateLimit(60, 60)
  @Get("vendor")
  async getVendorAnalytics(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<VendorAnalyticsResponse>>> {
    try {
      const data = await this.analyticsService.getVendorAnalytics(req.vendorProfile!.id);

      return responseUtils.success(res, {
        data,
        status: StatusCodes.OK,
        transformWith: VendorAnalyticsResponse,
      });
    } catch (error) {
      logger.error("Error Vendor Analytics:", error);
      return responseUtils.error({ res, error });
    }
  }
}
