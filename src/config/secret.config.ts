import { getOsEnv } from "./env.config";

export const secretConfig = {
  jwtSecretKey: getOsEnv("JWT_SECRET_KEY"),
  jwtExpirationTime: getOsEnv("JWT_EXPIRATION_TIME"),
  aesEncryptionKey: getOsEnv("AES_ENCRYPTION_KEY"),
  privateKey: getOsEnv("ENCRYPTION_PRIVATE_KEY").replace(/\\n/g, "\n"),

  publicKey: getOsEnv("ENCRYPTION_PUBLIC_KEY").replace(/\\n/g, "\n"),

  privateKeyPassphrase: getOsEnv("ENCRYPTION_PRIVATE_KEY_PASSPHRASE"),
  awsS3: {
    region: getOsEnv("AWS_REGION"),
    accessKeyId: getOsEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getOsEnv("AWS_SECRET_ACCESS_KEY"),
    bucketName: getOsEnv("AWS_BUCKET_NAME"),
    signedUrlExpiration: +getOsEnv("AWS_SIGNED_URL_EXPIRATION"),
    cloudFrontUrl: getOsEnv("AWS_CLOUDFRONT_URL"),
    cloudFrontKeyPairId: getOsEnv("CLOUDFRONT_KEY_PAIR_ID"),
    cloudFrontPrivateKey: getOsEnv("CLOUDFRONT_PRIVATE_KEY"),
  },
};
