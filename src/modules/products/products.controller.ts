import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { Public } from "src/decorators/public.decorator";
import { VendorStatus } from "src/decorators/vendor-status.decorator";
import { OptionalAuthGuard } from "src/guards/optional-auth.guard";
import { VendorStatusGuard } from "src/guards/vendor-status.guard";
import { logger } from "src/services/logger.service";

import { ApiTag } from "../../constants/api-tags.constants";
import { RoleGuard } from "../../guards/role-guard";
import responseUtils, { CommonResponseType } from "../../utils/response.utils";
import { RateLimit } from "../rateLimiter/decorators/rate-limit.decorator";
import { MessageResponse } from "../swagger/dtos/response.dtos";
import { ApiSwaggerPolymorphicResponse, ApiSwaggerResponse } from "../swagger/swagger.decorator";
import { UserRoleEnum } from "../users/user.constants";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { CreateProductDto } from "./dto/create-product.dto";
import { GetAllProductDto } from "./dto/get-all-product.dto";
import { UpdateProductStatusDto } from "./dto/update-product-status.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import {
  ProductAdminResponse,
  ProductListResponse,
  ProductPublicListResponse,
  ProductPublicResponse,
  ProductResponse,
  ProductVendorResponse,
} from "./product.response";
import { SUCCESS_MESSAGES } from "./products.constants";
import { ProductsService } from "./products.service";

import type { ProductDetailsResponse } from "./product.serializer";
import type { Request, Response } from "express";

@ApiTags(ApiTag.Products)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiSwaggerResponse(ProductPublicListResponse, { status: StatusCodes.OK })
  @Public()
  @RateLimit(60, 60)
  @Get("list")
  async getApprovedProducts(
    @Res() res: Response,
    @Query() query: GetAllProductDto,
  ): Promise<Response<CommonResponseType<ProductPublicListResponse>>> {
    try {
      const products = await this.productsService.getApprovedProducts(query);

      return responseUtils.success(res, {
        data: products,
        status: StatusCodes.OK,
        transformWith: ProductPublicListResponse,
      });
    } catch (error) {
      logger.error("Error fetching approved products list:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(ProductListResponse)
  @UseGuards(RoleGuard(UserRoleEnum.VENDOR), VendorStatusGuard)
  @VendorStatus(VendorStatusEnum.APPROVED)
  @RateLimit(60, 60)
  @Get("me")
  async getMyProducts(
    @Res() res: Response,
    @Req() req: Request,
    @Query() query: GetAllProductDto,
  ): Promise<Response<CommonResponseType<ProductListResponse>>> {
    try {
      const products = await this.productsService.getMyProducts(query, req.vendorProfile);

      return responseUtils.success(res, {
        data: products,
        status: StatusCodes.OK,
        transformWith: ProductListResponse,
      });
    } catch (error) {
      logger.error("Error fetching vendor products list:", error);
      return responseUtils.error({ res, error });
    }
  }

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

  @ApiSwaggerPolymorphicResponse({
    status: StatusCodes.OK,
    models: [ProductAdminResponse, ProductVendorResponse, ProductPublicResponse],
  })
  @Public()
  @UseGuards(OptionalAuthGuard)
  @RateLimit(60, 60)
  @Get(":id")
  async getProductById(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") productId: string,
  ): Promise<Response<CommonResponseType<ProductDetailsResponse>>> {
    try {
      const product = await this.productsService.getProductById(productId, req.user, req.vendorProfile);

      return responseUtils.success(res, {
        data: product,
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error fetching product details:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse, {
    status: StatusCodes.OK,
  })
  @UseGuards(RoleGuard(UserRoleEnum.VENDOR), VendorStatusGuard)
  @VendorStatus(VendorStatusEnum.APPROVED)
  @RateLimit(20, 60)
  @Patch(":id")
  async updateProduct(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.productsService.updateProduct(productId, dto, req.vendorProfile);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.PRODUCT_UPDATED_SUCCESS,
        },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error updating product:", error);

      return responseUtils.error({
        res,
        error,
      });
    }
  }

  @ApiSwaggerResponse(ProductListResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(60, 60)
  @Get()
  async getAllProducts(
    @Res() res: Response,
    @Query() query: GetAllProductDto,
  ): Promise<Response<CommonResponseType<ProductListResponse>>> {
    try {
      const products = await this.productsService.getAllProducts(query);

      return responseUtils.success(res, {
        data: products,
        status: StatusCodes.OK,
        transformWith: ProductListResponse,
      });
    } catch (error) {
      logger.error("Error fetching products list:", error);
      return responseUtils.error({ res, error });
    }
  }
}
