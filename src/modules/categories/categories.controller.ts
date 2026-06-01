import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { logger } from "src/services/logger.service";

import { ApiTag } from "../../constants/api-tags.constants";
import { RoleGuard } from "../../guards/role-guard";
import responseUtils, { CommonResponseType } from "../../utils/response.utils";
import { RateLimit } from "../rateLimiter/decorators/rate-limit.decorator";
import { MessageResponse } from "../swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";
import { UserRoleEnum } from "../users/user.constants";

import { SUCCESS_MESSAGES } from "./categories.constants";
import { CategoriesService } from "./categories.service";
import { CategoriesListResponse, CategoryResponse } from "./category.response";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { ListCategoriesDto } from "./dto/list-categories.dto";
import { UpdateCategoryDto, UpdateCategoryStatusDto } from "./dto/update-category.dto";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Categories)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiSwaggerResponse(CategoriesListResponse)
  @RateLimit(60, 60)
  @Get("public/list")
  async listActiveCategories(
    @Res() res: Response,
    @Query() query: ListCategoriesDto,
  ): Promise<Response<CommonResponseType<CategoriesListResponse>>> {
    try {
      const categories = await this.categoriesService.listCategories({ query, onlyActive: true });

      return responseUtils.success(res, {
        data: categories,
        status: StatusCodes.OK,
        transformWith: CategoriesListResponse,
      });
    } catch (error) {
      logger.error("Error listing active categories:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(CategoryResponse)
  @RateLimit(60, 60)
  @Get("public/:slug")
  async getCategoryBySlug(
    @Res() res: Response,
    @Param("slug") slug: string,
  ): Promise<Response<CommonResponseType<CategoryResponse>>> {
    try {
      const category = await this.categoriesService.getCategoryBySlug(slug);

      return responseUtils.success(res, {
        data: category,
        status: StatusCodes.OK,
        transformWith: CategoryResponse,
      });
    } catch (error) {
      logger.error(`Error fetching category with slug ${slug}:`, error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(CategoryResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Post()
  async createCategory(
    @Res() res: Response,
    @Req() req: Request,
    @Body() dto: CreateCategoryDto,
  ): Promise<Response<CommonResponseType<CategoryResponse>>> {
    try {
      const category = await this.categoriesService.createCategory(dto);

      return responseUtils.success(res, {
        data: category,
        status: StatusCodes.CREATED,
        transformWith: CategoryResponse,
      });
    } catch (error) {
      logger.error("Error creating category:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(CategoryResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @Get(":id")
  async getCategoryById(
    @Res() res: Response,
    @Param("id") id: string,
  ): Promise<Response<CommonResponseType<CategoryResponse>>> {
    try {
      const category = await this.categoriesService.getCategoryById(id);

      return responseUtils.success(res, {
        data: category,
        status: StatusCodes.OK,
        transformWith: CategoryResponse,
      });
    } catch (error) {
      logger.error(`Error fetching category with ID ${id}:`, error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Patch(":id")
  async updateCategory(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.categoriesService.updateCategory({ id, dto });

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.CATEGORY_UPDATED_SUCCESS,
        },
      });
    } catch (error) {
      logger.error(`Error updating category with ID ${id}:`, error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Delete(":id")
  async deleteCategory(
    @Res() res: Response,
    @Param("id") id: string,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.categoriesService.deleteCategory(id);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.CATEGORY_DELETED_SUCCESS,
        },
      });
    } catch (error) {
      logger.error(`Error deleting category with ID ${id}:`, error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Patch(":id/status")
  async updateCategoryStatus(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateCategoryStatusDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.categoriesService.updateCategoryStatus({ id, dto });

      return responseUtils.success(res, {
        data: {
          message: dto.isActive
            ? SUCCESS_MESSAGES.CATEGORY_ACTIVATED_SUCCESS
            : SUCCESS_MESSAGES.CATEGORY_DEACTIVATED_SUCCESS,
        },
      });
    } catch (error) {
      logger.error(`Error updating status for category with ID ${id}:`, error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(CategoriesListResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(60, 60)
  @Get()
  async listAllCategories(
    @Res() res: Response,
    @Query() query: ListCategoriesDto,
  ): Promise<Response<CommonResponseType<CategoriesListResponse>>> {
    try {
      const categories = await this.categoriesService.listCategories({ query });

      return responseUtils.success(res, {
        data: categories,
        status: StatusCodes.OK,
        transformWith: CategoriesListResponse,
      });
    } catch (error) {
      logger.error("Error listing categories:", error);
      return responseUtils.error({ res, error });
    }
  }
}
