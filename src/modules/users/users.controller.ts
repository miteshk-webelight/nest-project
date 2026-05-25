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

import { FindAllUsersDto } from "./dto/find-all-users.dto";
import { UpdateUserDto } from "./dto/update-user-dto";
import { CreateAdminDto, CreateUserDto } from "./dto/users.dto";
import { UserDetailsResponse } from "./responses/users-details.response";
import { UsersListResponse } from "./responses/users.response";
import { SUCCESS_MESSAGES, UserRoleEnum } from "./user.constants";
import { UsersService } from "./users.service";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Users)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Post("admins")
  async createAdmin(
    @Res() res: Response,
    @Req() req: Request,
    @Body() user: CreateAdminDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.usersService.createAdmin(user, req.user);
      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.ADMIN_CREATED_SUCCESS },
        status: StatusCodes.CREATED,
      });
    } catch (error) {
      logger.error("Error creating admin user:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(UserDetailsResponse)
  @UseGuards(RoleGuard(UserRoleEnum.USER, UserRoleEnum.VENDOR, UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Get("me")
  async getMyProfile(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<UserDetailsResponse>>> {
    try {
      const user = await this.usersService.getMyProfile(req.user);

      return responseUtils.success(res, {
        data: user,
        status: StatusCodes.OK,
        transformWith: UserDetailsResponse,
      });
    } catch (error) {
      logger.error("Error fetching user profile:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.USER, UserRoleEnum.VENDOR, UserRoleEnum.ADMIN))
  @RateLimit(5, 60)
  @Patch("me")
  async updateMyProfile(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: UpdateUserDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.usersService.updateMyProfile(req.user, dto);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.USER_UPDATED_SUCCESS,
        },
      });
    } catch (error) {
      logger.error("Error updating user profile:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @Get(":id")
  async findOne(
    @Res() res: Response,
    @Param("id") id: string,
  ): Promise<Response<CommonResponseType<UserDetailsResponse>>> {
    try {
      const user = await this.usersService.findOne(id);

      return responseUtils.success(res, {
        data: user,
        status: StatusCodes.OK,
        transformWith: UserDetailsResponse,
      });
    } catch (error) {
      logger.error(`Error fetching user with ID ${id}:`, error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(30, 60)
  @Delete(":id")
  async deleteUser(
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.usersService.deleteUser(id);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.USER_DELETED_SUCCESS,
        },
      });
    } catch (error) {
      logger.error(`Error deleting user with ID ${id}:`, error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(30, 60)
  @Patch(":id/restore")
  async restoreUser(
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.usersService.restoreUser(id);

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.USER_RESTORED_SUCCESS,
        },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error(`Error restoring user with ID ${id}:`, error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(20, 60)
  @Post()
  async create(
    @Res() res: Response,
    @Body() user: CreateUserDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.usersService.create(user);
      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.USER_CREATED_SUCCESS },
        status: StatusCodes.CREATED,
      });
    } catch (error) {
      logger.error("Error creating user:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(UsersListResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @RateLimit(60, 60) // limit to 60 requests per minute
  @Get()
  async findAll(
    @Res() res: Response,
    @Query() query: FindAllUsersDto,
  ): Promise<Response<CommonResponseType<UsersListResponse>>> {
    try {
      const users = await this.usersService.findAll(query);

      return responseUtils.success(res, {
        data: users,
        status: StatusCodes.OK,
        transformWith: UsersListResponse,
      });
    } catch (error) {
      logger.error("Error fetching users list:", error);
      return responseUtils.error({ res, error });
    }
  }
}
