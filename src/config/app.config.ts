import { getOsEnv } from "./env.config";

export const appConfig = {
  port: +(process.env.PORT ?? 3000),
  environment: getOsEnv("ENVIRONMENT"),
  sentryDsn: getOsEnv("SENTRY_DSN"),
  allowedOrigins: getOsEnv("ALLOWED_ORIGINS"),

  isLocal: getOsEnv("ENVIRONMENT") === "local",

  workerPort: +(process.env.WORKER_PORT ?? 3001),
  xApiKey: getOsEnv("X_API_KEY"),
  sourceEmail: getOsEnv("SOURCE_EMAIL"),
  frontendUrl: getOsEnv("FRONTEND_URL"),
  razorpay: {
    keyId: getOsEnv("RAZORPAY_KEY_ID"),
    secretKey: getOsEnv("RAZORPAY_KEY_SECRET"),
  },
  throttle: {
    ttl: +getOsEnv("THROTTLE_TTL"),
    limit: +getOsEnv("THROTTLE_LIMIT"),
  },
  otpExpiry: +getOsEnv("OTP_EXPIRY"),
  loginBlockDuration: +getOsEnv("LOGIN_BLOCK_DURATION"),
  maxLoginAttempts: +getOsEnv("MAX_LOGIN_ATTEMPTS"),
  cookieDomain: getOsEnv("COOKIE_DOMAIN"),
  tokenExpiry: {
    resetPasswordRedis: +getOsEnv("REDIS_RESET_PASSWORD_TOKEN_EXPIRY"),
    resetPassword: +getOsEnv("RESET_PASSWORD_TOKEN_EXPIRY"),
    refreshToken: +getOsEnv("REFRESH_TOKEN_EXPIRY"),
    accessToken: +getOsEnv("ACCESS_TOKEN_EXPIRY"),
    refreshTokenCookieExpiry: +getOsEnv("REFRESH_TOKEN_COOKIE_EXPIRY"),
    accessTokenCookieExpiry: +getOsEnv("ACCESS_TOKEN_COOKIE_EXPIRY"),
    invitation: +getOsEnv("INVITATION_TOKEN_EXPIRY"),
  },
  documents: {
    allowedFileTypes: getOsEnv("ALLOWED_FILE_TYPES").split(","),
  },
  presigned: {
    minFileSize: +getOsEnv("MIN_FILE_SIZE"),
    maxFileSize: +getOsEnv("MAX_FILE_SIZE"),
  },
  testEmail: {
    from: getOsEnv("TEST_EMAIL_FROM"),
    to: getOsEnv("TEST_EMAIL_TO"),
  },
};
