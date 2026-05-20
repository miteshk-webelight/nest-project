import { Controller, Res, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { ApiTag } from "src/constants/api-tags.constants";
import { MessageResponse } from "src/modules/swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "src/modules/swagger/swagger.decorator";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { SUCCESS_MESSAGES } from "../constants/message";

import { DownloadDto } from "./download.dto";
import { DownloadSignedUrlDto } from "./download.response";
import { DownloadService } from "./download.service";

import type { Response } from "express";

@ApiTags(ApiTag.Download)
@Controller("download")
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}
  @ApiSwaggerResponse(DownloadSignedUrlDto)
  @Get("signed-url")
  generateSignUrl(
    @Query() { key }: DownloadDto,
    @Res() res: Response,
  ): Response<CommonResponseType<DownloadSignedUrlDto>> {
    try {
      const result = this.downloadService.generateSignedUrl(key);
      return responseUtils.success(res, {
        data: result,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @Get("signed-cookies")
  generateSignCookies(
    @Query() { key }: DownloadDto,
    @Res() res: Response,
  ): Response<CommonResponseType<MessageResponse>> {
    try {
      this.downloadService.generateSignedCookies(key, res);
      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.CLOUDFRONT_SIGNED_COOKIES_GENERATED },
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }
}
