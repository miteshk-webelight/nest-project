import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { ApiTag } from "src/constants/api-tags.constants";
import { Public } from "src/decorators/public.decorator";
import { OptionalAuthGuard } from "src/guards/optional-auth.guard";
import { UsersEntity } from "src/modules/users/entity/users.entity";
import { logger } from "src/services/logger.service";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { RateLimit } from "../rateLimiter/decorators/rate-limit.decorator";
import { MessageResponse } from "../swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";

import { CART_HEADER_GUEST_TOKEN, SUCCESS_MESSAGES } from "./carts.constants";
import { CartsService } from "./carts.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/add-cart-item.dto";
import { CartResponse } from "./response/cart.response";
import { GuestSessionResponse } from "./response/guest-session.response";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Carts)
@Controller("carts")
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Public()
  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(OptionalAuthGuard)
  @Post("items")
  async addCartItem(
    @Headers(CART_HEADER_GUEST_TOKEN) guestToken: string,
    @Req() req: Request,
    @Body() dto: AddCartItemDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      const user = req.user as UsersEntity | undefined;
      await this.cartsService.addCartItem({
        dto,
        guestToken,
        user,
      });

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.ITEM_ADDED_TO_CART,
        },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error adding product to cart:", error);

      return responseUtils.error({
        res,
        error,
      });
    }
  }

  @Public()
  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(OptionalAuthGuard)
  @Patch("items/:productId")
  async updateCartItem(
    @Param("productId") productId: string,
    @Headers(CART_HEADER_GUEST_TOKEN) guestToken: string,
    @Req() req: Request,
    @Body() dto: UpdateCartItemDto,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      const user = req.user as UsersEntity | undefined;

      await this.cartsService.updateCartItem({
        productId,
        quantity: dto.quantity,
        guestToken,
        user,
      });

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.ITEM_UPDATED_IN_CART,
        },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error updating cart item:", error);

      return responseUtils.error({
        res,
        error,
      });
    }
  }

  @Public()
  @ApiSwaggerResponse(MessageResponse)
  @UseGuards(OptionalAuthGuard)
  @Delete("items/:productId")
  async removeCartItem(
    @Param("productId") productId: string,
    @Headers(CART_HEADER_GUEST_TOKEN) guestToken: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      const user = req.user as UsersEntity | undefined;

      await this.cartsService.removeCartItem({
        productId,
        guestToken,
        user,
      });

      return responseUtils.success(res, {
        data: {
          message: SUCCESS_MESSAGES.ITEM_REMOVED_FROM_CART,
        },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error removing cart item:", error);

      return responseUtils.error({
        res,
        error,
      });
    }
  }

  @Public()
  @ApiSwaggerResponse(CartResponse)
  @UseGuards(OptionalAuthGuard)
  @Get("me")
  async getCurrentCart(
    @Headers(CART_HEADER_GUEST_TOKEN) guestToken: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<CartResponse>>> {
    try {
      const user = req.user as UsersEntity | undefined;
      const cartResponse = await this.cartsService.getCurrentCart({
        guestToken,
        user,
      });

      return responseUtils.success(res, {
        data: cartResponse,
        status: StatusCodes.OK,
        transformWith: CartResponse,
      });
    } catch (error) {
      logger.error("Error fetching current cart:", error);

      return responseUtils.error({
        res,
        error,
      });
    }
  }

  @Public()
  @ApiSwaggerResponse(GuestSessionResponse)
  @RateLimit(20, 60)
  @Post("guest-session")
  generateGuestSession(@Res() res: Response): Response<CommonResponseType<GuestSessionResponse>> {
    try {
      const guestSession = this.cartsService.generateGuestToken();

      return responseUtils.success(res, {
        data: guestSession,
        status: StatusCodes.OK,
        transformWith: GuestSessionResponse,
      });
    } catch (error) {
      logger.error("Error generating guest session:", error);

      return responseUtils.error({
        res,
        error,
      });
    }
  }
}
