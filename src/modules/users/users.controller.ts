import { Body, Controller, Get, HttpException, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { ApiTag } from "../../constants/api-tags.constants";
import { Permission, Modules } from "../../constants/app.type";
import { RoleGuard } from "../../guards/role-guard";
import { PaginationDto } from "../../types/common.types";
import responseUtils, { CommonResponseType } from "../../utils/response.utils";
import { MessageResponse } from "../swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";

import { UserRoleEnum } from "./constants/enum";
import { SUCCESS_MESSAGES } from "./constants/message";
import { FindAllUsersDto } from "./dto/find-all-users.dto";
import { CreateAdminDto, CreateUserDto, RegisterVendorDto, UpdateVendorStatusDto } from "./users.dto";
import { UsersListResponse, UsersResponse } from "./users.response";
import { UsersService } from "./users.service";

import type { UserDetailsResponse } from "./users-details.response";
import type { Request, Response } from "express";

@ApiTags(ApiTag.Users)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
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
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
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
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @Post("vendor/register")
  async registerAsVendor(
    @Res() res: Response,
    @Req() req: Request,
    @Body() vendorDto: RegisterVendorDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.usersService.registerAsVendor(req.user, vendorDto);
      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.VENDOR_APPLICATION_SUBMITTED },
        status: StatusCodes.CREATED,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
  @Patch("vendor/:id/status")
  async updateVendorStatus(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") id: string,
    @Body() { status }: UpdateVendorStatusDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.usersService.updateVendorStatus(id, status, req.user);
      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.VENDOR_APPLICATION_UPDATED },
      });
    } catch (error) {
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
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(UsersListResponse)
  @UseGuards(RoleGuard(UserRoleEnum.ADMIN))
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
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }
}
