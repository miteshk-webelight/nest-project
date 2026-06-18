import { UnauthorizedException } from "@nestjs/common/exceptions";

import { AES, enc } from "crypto-js";
import { sign, verify, type JwtPayload } from "jsonwebtoken";

import { secretConfig } from "../../config/secret.config";
import { ERROR_MESSAGES } from "../../constants/messages.constants";

export class AuthHelperService {
  jwtSign(payload: object, expiresIn: string | number = secretConfig.jwtExpirationTime): string {
    return sign(payload, secretConfig.jwtSecretKey, {
      expiresIn,
    });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return verify(token, secretConfig.jwtSecretKey) as JwtPayload;
    } catch (e) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }

  decodeVerifyToken(authToken: string): { sub: string; rememberMe: boolean } {
    if (!authToken) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    return this.verifyToken(authToken);
  }
  decodeToken(authToken: string): { sub: string; sid: string } {
    if (!authToken) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    return this.verifyToken(authToken);
  }

  encryptData(data: string): string {
    return AES.encrypt(data, secretConfig.aesEncryptionKey).toString();
  }

  decryptData(data: string): string {
    const bytes = AES.decrypt(data, secretConfig.aesEncryptionKey);
    return bytes.toString(enc.Utf8);
  }

  validateGuardRequest(authToken: string): { sub: string } {
    return this.decodeToken(authToken);
  }
}
