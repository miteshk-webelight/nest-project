import { Controller, Res, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { ApiTag } from "src/constants/api-tags.constants";
import { ApiSwaggerResponse } from "src/modules/swagger/swagger.decorator";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { PresignDto } from "./presigned.dto";
import { PresignedPostResponseDto, PresignedResponseDto } from "./presigned.response";
import { PresignedService } from "./presigned.service";

import type { Response } from "express";

@ApiTags(ApiTag.Presigned)
@Controller("presigned")
export class PresignedController {
  constructor(private readonly presignedService: PresignedService) {}

  @ApiSwaggerResponse(PresignedResponseDto)
  @Get()
  async generatePresignedUrl(
    @Query() payload: PresignDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<PresignedResponseDto>>> {
    try {
      const result = await this.presignedService.generatePresignedUrl(payload);
      return responseUtils.success(res, {
        data: result,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(PresignedPostResponseDto)
  @Get("post")
  async postPresignedUrl(
    @Query() payload: PresignDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<PresignedPostResponseDto>>> {
    try {
      const result = await this.presignedService.generatePresignedPost(payload);
      return responseUtils.success(res, {
        data: result,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }
}
