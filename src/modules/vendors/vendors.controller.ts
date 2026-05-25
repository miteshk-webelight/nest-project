import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { VendorStatus } from "src/decorators/vendor-status.decorator";
import { VendorStatusGuard } from "src/guards/vendor-status.guard";
import { logger } from "src/services/logger.service";

import { ApiTag } from "../../constants/api-tags.constants";
import { RoleGuard } from "../../guards/role-guard";
import responseUtils, { CommonResponseType } from "../../utils/response.utils";
import { RateLimit } from "../rateLimiter/decorators/rate-limit.decorator";
import { MessageResponse } from "../swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";
import { UserRoleEnum } from "../users/user.constants";

import { RegisterVendorDto } from "./dto/register-vendor.dto";
import { UpdateVendorProfileDto } from "./dto/update-vendor-profile.dto";
import { UpdateVendorStatusDto } from "./dto/update-vendor-status.dto";
import { VendorStatusResponse } from "./responses/vendor-status.response";
import { VendorProfileResponse } from "./responses/vendors.response";
import { SUCCESS_MESSAGES, VendorStatusEnum } from "./vendors.constants";
import { VendorsService } from "./vendors.service";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Vendors)
@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @ApiSwaggerResponse(MessageResponse, {
    status: StatusCodes.CREATED,
  })
  @RateLimit(10, 60)
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @Post("register")
  async registerAsVendor(
    @Res() res: Response,
    @Req() req: Request,
    @Body() vendorDto: RegisterVendorDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.vendorsService.registerAsVendor(req.user, vendorDto);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.VENDOR_APPLICATION_SUBMITTED,
        },
        status: StatusCodes.CREATED,
      });
    } catch (error) {
      logger.error("Error registering as vendor:", error);
      return responseUtils.error({
        res,
        error,
      });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Patch(":id/status")
  async updateVendorStatus(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") id: string,
    @Body() { status }: UpdateVendorStatusDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.vendorsService.updateVendorStatus(id, status, req.user);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.VENDOR_APPLICATION_UPDATED,
        },
      });
    } catch (error) {
      logger.error(`Error updating vendor status for ID ${id}:`, error);
      return responseUtils.error({
        res,
        error,
      });
    }
  }

  @Get("me")
  @UseGuards(RoleGuard(UserRoleEnum.USER, UserRoleEnum.VENDOR))
  @RateLimit(20, 60)
  @ApiSwaggerResponse(VendorProfileResponse)
  async getMyProfile(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<VendorProfileResponse>>> {
    try {
      const vendor = await this.vendorsService.getMyVendorProfile(req.user);

      return responseUtils.success(res, {
        data: vendor,
        transformWith: VendorProfileResponse,
      });
    } catch (error) {
      logger.error("Error fetching vendor profile:", error);
      return responseUtils.error({ res, error });
    }
  }

  @Get("me/status")
  @UseGuards(RoleGuard(UserRoleEnum.USER, UserRoleEnum.VENDOR))
  @RateLimit(30, 60)
  @ApiSwaggerResponse(VendorStatusResponse)
  async getStatus(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<VendorStatusResponse>>> {
    try {
      const status = await this.vendorsService.getMyVendorStatus(req.user);

      return responseUtils.success(res, {
        data: status,
        transformWith: VendorStatusResponse,
      });
    } catch (error) {
      logger.error("Error fetching vendor status:", error);
      return responseUtils.error({ res, error });
    }
  }

  @Patch("me")
  @UseGuards(RoleGuard(UserRoleEnum.VENDOR), VendorStatusGuard)
  // Suspended vendor can't update their profile information
  @VendorStatus(VendorStatusEnum.APPROVED, VendorStatusEnum.REJECTED, VendorStatusEnum.PENDING)
  @RateLimit(10, 60)
  @ApiSwaggerResponse(MessageResponse)
  async updateProfile(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: UpdateVendorProfileDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.vendorsService.updateMyVendorProfile(req.user, dto);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.VENDOR_PROFILE_UPDATED,
        },
      });
    } catch (error) {
      logger.error("Error updating vendor profile:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @Delete(":id")
  async deleteVendor(
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.vendorsService.deleteVendorProfile(id);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.VENDOR_DELETED_SUCCESS,
        },
      });
    } catch (error) {
      logger.error(`Error deleting vendor with ID ${id}:`, error);
      return responseUtils.error({ res, error });
    }
  }
}
