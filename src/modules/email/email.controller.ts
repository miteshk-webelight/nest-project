import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
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

import { SaveEmailProviderDto } from "./dto/save-email-provider.dto";
import { EmailProviderResponse } from "./email-provider.response";
import { EmailService } from "./email.service";

import type { Response } from "express";

@ApiTags(ApiTag.Email)
@Controller("email")
@UseGuards(RoleGuard(UserRoleEnum.ADMIN))
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @ApiSwaggerResponse(MessageResponse, {
    status: StatusCodes.CREATED,
  })
  @RateLimit(5, 60)
  @Post("provider")
  async saveProvider(
    @Res() res: Response,
    @Body() dto: SaveEmailProviderDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      const result = await this.emailService.saveProvider(dto);

      return responseUtils.success(res, {
        data: result,
        status: StatusCodes.CREATED,
      });
    } catch (error) {
      logger.error("Error saving email provider:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(EmailProviderResponse)
  @RateLimit(20, 60)
  @Get("provider")
  async getProvider(@Res() res: Response): Promise<Response<CommonResponseType<EmailProviderResponse>>> {
    try {
      const provider = await this.emailService.getProvider();

      return responseUtils.success(res, {
        data: provider,
        transformWith: EmailProviderResponse,
      });
    } catch (error) {
      logger.error("Error fetching email provider:", error);
      return responseUtils.error({ res, error });
    }
  }
}
