import { appConfig } from "../config/app.config";
import { TokenEnum } from "../modules/auth/constants/enum";

import type { CookieOptions, Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions: CookieOptions = {
  domain: appConfig.cookieDomain || undefined,
  secure: isProduction,
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
};

export const setOtpCookie = (res: Response, token: string): void => {
  const expiresAt = new Date(Date.now() + Number(appConfig.otpExpiry) * 1000);
  res.cookie(TokenEnum.VERIFY_TOKEN, token, {
    ...cookieOptions,
    expires: expiresAt,
  });
};

export const setAuthCookie = (res: Response, token: string): void => {
  const expiresAt = new Date(Date.now() + Number(appConfig.tokenExpiry.accessTokenCookieExpiry) * 1000);
  res.cookie(TokenEnum.ACCESS_TOKEN, token, {
    ...cookieOptions,
    expires: expiresAt,
  });
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  const expiresAt = new Date(Date.now() + Number(appConfig.tokenExpiry.refreshTokenCookieExpiry) * 1000);
  res.cookie(TokenEnum.REFRESH_TOKEN, token, {
    ...cookieOptions,
    expires: expiresAt,
  });
};

export const clearCookies = (res: Response, cookies: string[]): void => {
  cookies.forEach((cookie) => {
    res.clearCookie(cookie, cookieOptions);
  });
};
export const setCloudFrontCookies = (res: Response, cookies: Record<string, string>, expires: number): void => {
  Object.entries(cookies).forEach(([key, value]) => {
    res.cookie(key, value, {
      ...cookieOptions,
      expires: new Date(expires * 1000),
    });
  });
};
