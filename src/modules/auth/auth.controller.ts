import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { ApiTag } from "../../constants/api-tags.constants";
import { Public } from "../../decorators/public.decorator";
import { RateLimit } from "../../decorators/rate-limit.decorator";
import { clearCookies, setAuthCookie, setRefreshTokenCookie } from "../../utils/cookie.utils";
import responseUtils, { CommonResponseType } from "../../utils/response.utils";
import { MessageResponse } from "../swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";

import { AuthService } from "./auth.service";
import { TokenEnum } from "./constants/enum";
import { SUCCESS_MESSAGES } from "./constants/messages";
import { LoginUserDto, SignupUserDto } from "./dto/login.user.dto";
import { EmailDto, ResetPasswordDto } from "./dto/reset-password.dto";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Auth)
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiSwaggerResponse(MessageResponse)
  @Public()
  @RateLimit(5, 60) // limit to 5 requests per minute
  @Post("signup")
  async signup(
    @Res() res: Response,
    @Req() req: Request,
    @Body() user: SignupUserDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.authService.signup(user, res, req);
      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.USER_SIGNUP_SUCCESS },
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @Public()
  @RateLimit(5, 60)
  @Post("login")
  async login(
    @Res() res: Response,
    @Req() req: Request,
    @Body() { email, password }: LoginUserDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.authService.login(email, password, res, req);
      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.USER_LOGIN_SUCCESS },
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @Public()
  @RateLimit(5, 60)
  @Post("refresh")
  async refreshToken(
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      const refreshToken = req.cookies.rtk;

      if (!refreshToken) {
        throw new UnauthorizedException("Refresh token missing");
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      setAuthCookie(res, tokens.accessToken);
      setRefreshTokenCookie(res, tokens.refreshToken);

      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.REFRESH_TOKEN_SUCCESS },
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @Post("logout")
  async logout(@Res() res: Response, @Req() req: Request): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.authService.logout(req.cookies.rtk);
      clearCookies(res, [TokenEnum.ACCESS_TOKEN, TokenEnum.REFRESH_TOKEN]);

      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.USER_LOGOUT_SUCCESS },
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @Public()
  @RateLimit(5, 60)
  @Post("reset-password/link")
  async generateResetPasswordLink(
    @Res() res: Response,
    @Body() { email }: EmailDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.authService.generateResetPasswordLink(email);

      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.RESET_PASSWORD_LINK_SENT },
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(MessageResponse)
  @Public()
  @RateLimit(5, 60)
  @Post("reset-password")
  async resetPassword(
    @Res() res: Response,
    @Body() { token, password }: ResetPasswordDto,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      await this.authService.resetPassword(token, password);

      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.RESET_PASSWORD_SUCCESS },
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }
}
