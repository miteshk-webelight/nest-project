import { Body, Controller, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StatusCodes } from "http-status-codes";

import { ApiTag } from "src/constants/api-tags.constants";
import { RoleGuard } from "src/guards/role-guard";
import { RateLimit } from "src/modules/rateLimiter/decorators/rate-limit.decorator";
import { ApiSwaggerResponse } from "src/modules/swagger/swagger.decorator";
import { UserRoleEnum } from "src/modules/users/user.constants";
import { logger } from "src/services/logger.service";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { CheckoutDto } from "../dto/checkout.dto";
import { CheckoutResponse } from "../responses/checkout.response";
import { PaymentResponse } from "../responses/payment.response";
import { CheckoutService } from "../services/checkout.service";
import { PaymentService } from "../services/payment.service";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Orders)
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly paymentService: PaymentService,
  ) {}

  @ApiSwaggerResponse(CheckoutResponse, { status: StatusCodes.CREATED })
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @RateLimit(10, 60)
  @Post("checkout")
  async checkout(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CheckoutDto,
  ): Promise<Response<CommonResponseType<CheckoutResponse>>> {
    try {
      const checkoutResponse = await this.checkoutService.checkout(dto, req.user.id);

      return responseUtils.success(res, {
        data: checkoutResponse,
        status: StatusCodes.CREATED,
        transformWith: CheckoutResponse,
      });
    } catch (error) {
      logger.error("Error during checkout:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(PaymentResponse)
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @RateLimit(10, 60)
  @Post(":id/payment")
  async initiatePayment(
    @Param("id") orderId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<PaymentResponse>>> {
    try {
      const paymentResponse = await this.paymentService.initiatePayment(orderId, req.user.id);

      return responseUtils.success(res, {
        data: paymentResponse,
        status: StatusCodes.OK,
        transformWith: PaymentResponse,
      });
    } catch (error) {
      logger.error("Error initiating payment:", error);
      return responseUtils.error({ res, error });
    }
  }
}
