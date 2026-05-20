import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { appConfig } from "../config/app.config";
import { secretConfig } from "../config/secret.config";

import type { Conditions } from "@aws-sdk/s3-presigned-post/dist-types/types";

const { awsS3 } = secretConfig;

export const s3 = new S3Client({
  region: awsS3.region,
  credentials: {
    accessKeyId: awsS3.accessKeyId,
    secretAccessKey: awsS3.secretAccessKey,
  },
});

export const generateSignedUrl = async (command: AnyType): Promise<string> => {
  const url = await getSignedUrl(s3, command, {
    expiresIn: +awsS3.signedUrlExpiration,
  });
  return url;
};

export const getAllowedFileCondition = (fileType: string): { conditions: Conditions; contentTypeField: string } => {
  const { documents } = appConfig;
  const checkFileAllowed = documents.allowedFileTypes.find(
    (item: string) => item.includes(fileType) || fileType.includes(item) || item === fileType,
  );

  return {
    conditions: ["starts-with", "$Content-Type", checkFileAllowed] as Conditions,
    contentTypeField: checkFileAllowed ?? "",
  };
};
