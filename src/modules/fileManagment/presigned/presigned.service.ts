import { Injectable } from "@nestjs/common";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

import { appConfig } from "src/config/app.config";
import { secretConfig } from "src/config/secret.config";
import { generateSignedUrl, s3, getAllowedFileCondition } from "src/utils/awsS3.utils";
import { transformToInstance } from "src/utils/helper.utils";

import { PresignDto } from "./presigned.dto";
import { PresignedPostResponseDto, PresignedResponseDto } from "./presigned.response";

@Injectable()
export class PresignedService {
  private readonly bucketName = secretConfig.awsS3.bucketName;
  private readonly cloudFrontUrl = secretConfig.awsS3.cloudFrontUrl;
  private readonly expireInSeconds = +secretConfig.awsS3.signedUrlExpiration;

  async generatePresignedUrl(payload: PresignDto): Promise<PresignedResponseDto> {
    const { fileName, fileType, accessControl, metadata } = payload;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      ContentType: fileType,
      ACL: accessControl,
      Metadata: metadata,
    });
    const signedRequest = await generateSignedUrl(command);
    return transformToInstance(PresignedResponseDto, {
      signedRequest,
      cloudFrontURL: this.cloudFrontUrl,
    }) as PresignedResponseDto;
  }

  async generatePresignedPost(payload: PresignDto): Promise<PresignedPostResponseDto> {
    const { fileName, fileType, accessControl, metadata } = payload;
    const { conditions } = getAllowedFileCondition(fileType);
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: this.bucketName,
      Key: fileName,
      Conditions: [
        { acl: accessControl },
        conditions,
        ["content-length-range", appConfig.presigned.minFileSize, appConfig.presigned.maxFileSize],
      ],
      Fields: {
        acl: accessControl,
        key: fileName,
        "Content-Type": fileType,
        ...metadata,
      },
      Expires: this.expireInSeconds,
    });
    return transformToInstance(PresignedPostResponseDto, {
      signedRequest: { url, fields },
      cloudFrontURL: this.cloudFrontUrl,
    }) as PresignedPostResponseDto;
  }
}
