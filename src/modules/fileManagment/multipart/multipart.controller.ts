import { Controller, Post, Body, Res, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { ApiTag } from "src/constants/api-tags.constants";
import { MessageResponse } from "src/modules/swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "src/modules/swagger/swagger.decorator";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { SUCCESS_MESSAGES } from "../constants/message";

import {
  AbortMultipartDto,
  MultipartDto,
  GeneratePresignedUrlsDto,
  CompleteMultipartDto,
  ListUploadedChunksDto,
} from "./multipart.dto";
import {
  CompleteMultipartResponseDto,
  InitiateMultipartResponseDto,
  ListUploadedChunksResponseDto,
  MultipartPresignedUrlsResponseDto,
} from "./multipart.response";
import { MultiPartService } from "./multipart.service";

import type { Response } from "express";

@ApiTags(ApiTag.Multipart)
@Controller("multipart")
export class MultipartController {
  constructor(private readonly multipartService: MultiPartService) {}

  @ApiSwaggerResponse(InitiateMultipartResponseDto)
  @Post("initiate")
  async initiateMultipartUpload(
    @Body() payload: MultipartDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<InitiateMultipartResponseDto>>> {
    try {
      const result = await this.multipartService.initiateMultipartUpload(payload);
      return responseUtils.success(res, {
        data: result,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MultipartPresignedUrlsResponseDto)
  @Post("presigned-urls")
  async generatePresignedUrls(
    @Body() payload: GeneratePresignedUrlsDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MultipartPresignedUrlsResponseDto>>> {
    try {
      const result = await this.multipartService.generatePresignedUrls(payload);
      return responseUtils.success(res, {
        data: result,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(CompleteMultipartResponseDto)
  @Post("complete")
  async completeMultipartUpload(
    @Body() payload: CompleteMultipartDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<CompleteMultipartResponseDto>>> {
    try {
      const result = await this.multipartService.completeMultipartUpload(payload);
      return responseUtils.success(res, {
        data: result,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @Post("abort")
  async abortMultipartUpload(
    @Body() payload: AbortMultipartDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.multipartService.abortMultipartUpload(payload);
      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.MULTIPART_UPLOAD_ABORTED },
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(ListUploadedChunksResponseDto)
  @Get("uploaded-chunks")
  async listUploadedChunks(
    @Query() payload: ListUploadedChunksDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<ListUploadedChunksResponseDto>>> {
    try {
      const result = await this.multipartService.listUploadedChunks(payload);
      return responseUtils.success(res, {
        data: result,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }
}
