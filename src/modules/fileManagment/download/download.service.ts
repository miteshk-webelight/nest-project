import crypto from "crypto";

import { Injectable } from "@nestjs/common";

import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import { secretConfig } from "src/config/secret.config";
import { setCloudFrontCookies } from "src/utils/cookie.utils";
import { transformToInstance } from "src/utils/helper.utils";

import { DownloadSignedUrlDto } from "./download.response";

import type { Response } from "express";

@Injectable()
export class DownloadService {
  private readonly cloudfrontUrl = secretConfig.awsS3.cloudFrontUrl;
  private readonly keyPairId = secretConfig.awsS3.cloudFrontKeyPairId;
  private readonly privateKey = secretConfig.awsS3.cloudFrontPrivateKey;
  private readonly expireInSeconds = +secretConfig.awsS3.signedUrlExpiration;

  generateSignedUrl(key: string): DownloadSignedUrlDto {
    const fileUrl = `${this.cloudfrontUrl}${key}`;

    const signedUrl = getSignedUrl({
      url: fileUrl,
      keyPairId: this.keyPairId,
      privateKey: this.privateKey,
      dateLessThan: new Date(Date.now() + this.expireInSeconds * 1000),
    });

    return transformToInstance(DownloadSignedUrlDto, { url: signedUrl }) as DownloadSignedUrlDto;
  }

  generateSignedCookies(key: string, res: Response): void {
    const fileUrl = `${this.cloudfrontUrl}${key}`;
    const expires = Math.floor(Date.now() / 1000) + this.expireInSeconds;

    const policy = JSON.stringify({
      Statement: [
        {
          Resource: fileUrl,
          Condition: {
            DateLessThan: { "AWS:EpochTime": expires },
          },
        },
      ],
    });

    const policyBase64 = Buffer.from(policy).toString("base64");

    const signature = crypto.createSign("RSA-SHA1").update(policy).sign(this.privateKey, "base64");

    setCloudFrontCookies(
      res,
      {
        "CloudFront-Policy": policyBase64,
        "CloudFront-Signature": signature,
        "CloudFront-Key-Pair-Id": this.keyPairId,
        "CloudFront-Expires": expires.toString(),
      },
      expires,
    );
  }
}
