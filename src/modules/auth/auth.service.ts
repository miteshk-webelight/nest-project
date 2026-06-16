import crypto from "crypto";

import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";

import { Request, Response } from "express";
import { Repository } from "typeorm";

import { appConfig } from "../../config/app.config";
import { AuthHelperService } from "../../modules/auth/auth.helper.service";
import { setAuthCookie, setRefreshTokenCookie } from "../../utils/cookie.utils";
import { sendResetPasswordEmail } from "../../utils/email.utils";
import { decryptValue } from "../../utils/encryption.utils";
import { RedisService } from "../redis/redis.service";
import { UsersEntity } from "../users/entity/users.entity";
import { UsersService } from "../users/users.service";
import { UserSessionService } from "../userSessions/userSession.service";

import { AuthEvents, type UserLoggedInEventPayload, type UserSignedUpEventPayload } from "./constants/auth-events";
import { ERROR_MESSAGES } from "./constants/messages";
import { SignupUserDto } from "./dto/login.user.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
    private readonly authService: AuthHelperService,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly userSessionService: UserSessionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private getExpiryDate(expiresIn: string): Date {
    const numericExpiry = Number(expiresIn);
    if (!Number.isNaN(numericExpiry)) return new Date(Date.now() + numericExpiry * 1000);

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + Number(appConfig.tokenExpiry.refreshTokenCookieExpiry) * 1000);

    const value = Number(match[1]);
    const unit = match[2] as "s" | "m" | "h" | "d";
    const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];

    return new Date(Date.now() + value * multiplier);
  }

  private getRequestMeta(req?: Request): { ipAddress?: string; userAgent?: string } {
    return {
      ipAddress: req?.ip,
      userAgent: req?.headers["user-agent"],
    };
  }

  private getPlainPassword(password: string): string {
    try {
      return decryptValue(password);
    } catch {
      return password;
    }
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const iterations = 120_000;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");

    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

  private verifyPassword(password: string, storedPassword: string): boolean {
    const plainPassword = this.getPlainPassword(password);

    if (storedPassword.startsWith("pbkdf2$")) {
      const [, iterationsValue, salt, storedHash] = storedPassword.split("$");
      const iterations = Number(iterationsValue);
      if (!iterations || !salt || !storedHash) return false;

      const hash = crypto.pbkdf2Sync(plainPassword, salt, iterations, 64, "sha512").toString("hex");
      if (hash.length !== storedHash.length) return false;

      return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
    }

    return plainPassword === this.authService.decryptData(storedPassword);
  }

  async setLoginCookies(res: Response, userId: string, req?: Request): Promise<void> {
    const session = await this.userSessionService.create({
      userId,
      refreshTokenHash: "",
      expiresAt: this.getExpiryDate(appConfig.tokenExpiry.refreshToken),
      ...this.getRequestMeta(req),
    });

    const sid = session.id;

    const accessToken = this.authService.jwtSign({ sub: userId, sid }, appConfig.tokenExpiry.accessToken);

    const refreshToken = this.authService.jwtSign({ sub: userId, sid }, appConfig.tokenExpiry.refreshToken);

    await this.userSessionService.update(sid, {
      refreshTokenHash: this.hashToken(refreshToken),
    });

    setAuthCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
  }

  private emitUserLoggedIn(payload: UserLoggedInEventPayload): void {
    this.eventEmitter.emit(AuthEvents.USER_LOGGED_IN, payload);
  }

  async signup(user: SignupUserDto, res: Response, req?: Request, guestToken?: string): Promise<void> {
    const newUser = await this.userService.create(user);
    await this.setLoginCookies(res, newUser.id, req);

    this.emitUserLoggedIn({
      userId: newUser.id,
      guestToken,
      isNewUser: true,
    });

    this.eventEmitter.emit(AuthEvents.USER_SIGNED_UP, {
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
    });
  }

  private async checkLoginAttempts(email: string): Promise<void> {
    const blockKey = `login_blocked:${email}`;

    const isBlocked = await this.redisService.get(blockKey);
    if (isBlocked) {
      throw new BadRequestException(ERROR_MESSAGES.LOGIN_BLOCKED(appConfig.loginBlockDuration));
    }
  }

  private async handleFailedLoginAttempt(email: string): Promise<void> {
    const attemptsKey = `login_attempts:${email}`;
    const blockKey = `login_blocked:${email}`;
    const attempts = (await this.redisService.get(attemptsKey)) ?? 0;
    const newAttempts = parseInt(attempts.toString()) + 1;

    if (newAttempts >= appConfig.maxLoginAttempts) {
      await this.redisService.set(blockKey, "1", appConfig.loginBlockDuration);
      await this.redisService.delete([attemptsKey]);
      throw new BadRequestException(ERROR_MESSAGES.LOGIN_BLOCKED(appConfig.loginBlockDuration));
    } else {
      await this.redisService.set(attemptsKey, newAttempts.toString(), appConfig.loginBlockDuration);
      const remainingAttempts = appConfig.maxLoginAttempts - newAttempts;
      throw new BadRequestException(ERROR_MESSAGES.INVALID_CREDENTIALS(remainingAttempts));
    }
  }

  async login(email: string, password: string, res: Response, req?: Request, guestToken?: string): Promise<boolean> {
    await this.checkLoginAttempts(email);

    const user = await this.userRepository
      .createQueryBuilder("user")
      .where("user.email ILIKE :email", { email })
      .getOne();

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD);
    }

    if (!user.password || !this.verifyPassword(password, user.password)) {
      await this.handleFailedLoginAttempt(email);
    }

    await this.redisService.delete([`login_attempts:${email}`, `login_blocked:${email}`]);

    await this.setLoginCookies(res, user.id, req);

    this.emitUserLoggedIn({
      userId: user.id,
      guestToken,
      isNewUser: false,
    });

    return true;
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { sub, sid } = this.authService.decodeToken(token);

    if (!sub || !sid) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const session = await this.userSessionService.findActiveById(sid);
    if (session.userId !== sub || session.refreshTokenHash !== this.hashToken(token)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const accessToken = this.authService.jwtSign({ sub, sid }, appConfig.tokenExpiry.accessToken);
    const refreshToken = this.authService.jwtSign({ sub, sid }, appConfig.tokenExpiry.refreshToken);

    await this.userSessionService.update(sid, {
      refreshTokenHash: this.hashToken(refreshToken),
      expiresAt: this.getExpiryDate(appConfig.tokenExpiry.refreshToken),
    });
    return { accessToken, refreshToken };
  }

  async logout(token?: string): Promise<void> {
    if (!token) return;

    const { sid } = this.authService.decodeToken(token);
    if (sid) {
      await this.userSessionService.revoke(sid);
    }
  }

  async generateResetPasswordLink(email: string): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .where("user.email ILIKE :email", { email })
      .getOne();

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const forgotPasswordToken = this.authService.jwtSign({ sub: user.id }, appConfig.tokenExpiry.resetPassword);

    await sendResetPasswordEmail(email, `${appConfig.frontendUrl}/reset-password?token=${forgotPasswordToken}`);

    await this.redisService.set(
      `reset-password-token-${user.id}`,
      forgotPasswordToken,
      appConfig.tokenExpiry.resetPasswordRedis,
    );
  }

  async resetPassword(token: string, password: string): Promise<boolean> {
    const { sub } = this.authService.decodeToken(token);
    const isTokenValid = await this.redisService.get(`reset-password-token-${sub}`);
    if (!isTokenValid || isTokenValid !== token) {
      throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await this.userRepository.createQueryBuilder("user").where("user.id = :id", { id: sub }).getOne();

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await this.userRepository.update({ id: sub }, { password: this.hashPassword(password) });
    await this.redisService.delete([`reset-password-token-${sub}`]);

    return true;
  }
}
