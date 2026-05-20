import { Injectable, NotFoundException } from "@nestjs/common";

import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from "@aws-sdk/client-s3";

import { secretConfig } from "src/config/secret.config";
import { generateSignedUrl, s3 } from "src/utils/awsS3.utils";
import { transformToInstance } from "src/utils/helper.utils";

import { ERROR_MESSAGES } from "../constants/message";

import {
  AbortMultipartDto,
  CompleteMultipartDto,
  GeneratePresignedUrlsDto,
  ListUploadedChunksDto,
  MultipartDto,
} from "./multipart.dto";
import {
  CompleteMultipartResponseDto,
  InitiateMultipartResponseDto,
  ListUploadedChunksResponseDto,
  MultipartPresignedUrlsResponseDto,
} from "./multipart.response";

@Injectable()
export class MultiPartService {
  private readonly bucketName = secretConfig.awsS3.bucketName;
  async initiateMultipartUpload(payload: MultipartDto): Promise<InitiateMultipartResponseDto> {
    const { key, contentType, accessControl, contentDisposition, metadata } = payload;
    const initiateMultipartUploadCommand = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: accessControl,
      ContentDisposition: contentDisposition,
      Metadata: metadata,
    });
    const { UploadId: uploadId } = await s3.send(initiateMultipartUploadCommand);
    return transformToInstance(InitiateMultipartResponseDto, { uploadId }) as InitiateMultipartResponseDto;
  }
  async generatePresignedUrls(payload: GeneratePresignedUrlsDto): Promise<MultipartPresignedUrlsResponseDto> {
    const { uploadId, totalParts, key } = payload;

    const presignedUrls = await Promise.all(
      Array.from({ length: totalParts }, async (_, index) => {
        const partNumber = index + 1;
        const uploadPartCommand = new UploadPartCommand({
          Bucket: this.bucketName,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });
        const signedUrl = await generateSignedUrl(uploadPartCommand);
        return { signedUrl, partNumber };
      }),
    );
    return transformToInstance(MultipartPresignedUrlsResponseDto, {
      presignedUrls,
    }) as MultipartPresignedUrlsResponseDto;
  }

  async completeMultipartUpload(payload: CompleteMultipartDto): Promise<CompleteMultipartResponseDto> {
    const { uploadId, parts, key } = payload;
    const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });
    const result = await s3.send(completeMultipartUploadCommand);
    return transformToInstance(CompleteMultipartResponseDto, result) as CompleteMultipartResponseDto;
  }

  async abortMultipartUpload(payload: AbortMultipartDto): Promise<boolean> {
    const { uploadId, key } = payload;
    const abortMultipartUploadCommand = new AbortMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
    });

    await s3.send(abortMultipartUploadCommand);
    return true;
  }

  async listUploadedChunks(payload: ListUploadedChunksDto): Promise<ListUploadedChunksResponseDto> {
    const { uploadId, key } = payload;
    const listMultipartUploadPartsCommand = new ListPartsCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
    });
    const result = await s3.send(listMultipartUploadPartsCommand);

    const parts = result.Parts?.map(({ PartNumber, ETag }) => {
      return {
        partNumber: PartNumber,
        ETag,
      };
    });
    if (!parts) {
      throw new NotFoundException(ERROR_MESSAGES.MULTIPART_PARTS_NOT_FOUND);
    }

    return transformToInstance(ListUploadedChunksResponseDto, {
      parts,
    }) as ListUploadedChunksResponseDto;
  }
}
