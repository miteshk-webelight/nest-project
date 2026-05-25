import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { VendorStatus } from "src/decorators/vendor-status.decorator";
import { logger } from "src/services/logger.service";

import { ApiTag } from "../../constants/api-tags.constants";
import { RoleGuard } from "../../guards/role-guard";
import responseUtils, { CommonResponseType } from "../../utils/response.utils";
import { RateLimit } from "../rateLimiter/decorators/rate-limit.decorator";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";
import { UserRoleEnum } from "../users/user.constants";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { CreateProductDto } from "./dto/create-product.dto";
import { ProductsService } from "./products.service";
import { ProductResponse } from "./responses/product.response";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Products)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiSwaggerResponse(ProductResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.VENDOR))
  @VendorStatus(VendorStatusEnum.APPROVED)
  @RateLimit(20, 60)
  @Post()
  async createProduct(
    @Res() res: Response,
    @Req() req: Request,
    @Body() dto: CreateProductDto,
  ): Promise<Response<CommonResponseType<ProductResponse>>> {
    try {
      const product = await this.productsService.createProduct(dto, req.user);

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
}
