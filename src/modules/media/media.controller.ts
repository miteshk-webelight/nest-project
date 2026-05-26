import { Controller, Post, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";
import { memoryStorage } from "multer";

import { logger } from "src/services/logger.service";

import { ApiTag } from "../../constants/api-tags.constants";
import { RoleGuard } from "../../guards/role-guard";
import responseUtils, { CommonResponseType } from "../../utils/response.utils";
import { RateLimit } from "../rateLimiter/decorators/rate-limit.decorator";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";
import { UserRoleEnum } from "../users/user.constants";

import { MEDIA_CONSTANTS } from "./media.constants";
import { MediaEntity } from "./media.entity";
import { MediaResponse } from "./media.response";
import { MediaService } from "./media.service";

import type { Response } from "express";

@ApiTags(ApiTag.Media)
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiSwaggerResponse(MediaResponse, {
    status: StatusCodes.CREATED,
  })
  @UseGuards(RoleGuard(UserRoleEnum.VENDOR))
  @RateLimit(10, 60)
  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FilesInterceptor("files", MEDIA_CONSTANTS.MAX_FILES, {
      storage: memoryStorage(),
    }),
  )
  async uploadMedia(
    @Res() res: Response,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Response<CommonResponseType<MediaResponse>>> {
    try {
      const uploadedMedia = await this.mediaService.uploadFiles(files);

      return responseUtils.success<MediaEntity[], MediaResponse>(res, {
        data: uploadedMedia as MediaEntity[],
        status: StatusCodes.CREATED,
        transformWith: MediaResponse,
      });
    } catch (error) {
      logger.error("Error uploading media:", error);
      return responseUtils.error({ res, error });
    }
  }
}
