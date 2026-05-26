import { Body, Controller, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
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
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductStatusDto } from "./dto/update-product-status.dto";
import { ProductResponse } from "./product.response";
import { SUCCESS_MESSAGES } from "./products.constants";
import { ProductsService } from "./products.service";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Products)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiSwaggerResponse(ProductResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.VENDOR), VendorStatusGuard)
  @VendorStatus(VendorStatusEnum.APPROVED)
  @RateLimit(20, 60)
  @Post()
  async createProduct(
    @Res() res: Response,
    @Req() req: Request,
    @Body() dto: CreateProductDto,
  ): Promise<Response<CommonResponseType<ProductResponse>>> {
    try {
      const product = await this.productsService.createProduct(dto, req.vendorProfile);

      return responseUtils.success(res, {
        data: product,
        status: StatusCodes.CREATED,
        transformWith: ProductResponse,
      });
    } catch (error) {
      logger.error("Error creating product:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.OK })
  @UseGuards(RoleGuard(UserRoleEnum.VENDOR), VendorStatusGuard)
  @VendorStatus(VendorStatusEnum.APPROVED)
  @RateLimit(20, 60)
  @Post(":id/submit")
  async submitProductApprovalRequest(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") productId: string,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.productsService.submitProductApprovalRequest(productId, req.vendorProfile);

      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.PRODUCT_APPROVAL_REQUEST_SUBMITTED_SUCCESS },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error submitting product approval request:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.OK })
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Patch(":id/status")
  async updateProductStatus(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: UpdateProductStatusDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.productsService.updateProductStatus(productId, dto.status, req.user);

      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.PRODUCT_UPDATED_SUCCESS },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error updating product status:", error);
      return responseUtils.error({ res, error });
    }
  }
}
