import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
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
import { ListOrdersDto } from "../dto/list-orders.dto";
import { CheckoutResponse } from "../responses/checkout.response";
import { OrderDetailsResponse } from "../responses/order-details.response";
import { OrdersListResponse } from "../responses/order-list.response";
import { PaymentResponse } from "../responses/payment.response";
import { CheckoutService } from "../services/checkout.service";
import { OrderService } from "../services/order.service";
import { PaymentService } from "../services/payment.service";

import type { Request, Response } from "express";

@ApiTags(ApiTag.Orders)
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
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

  @ApiSwaggerResponse(OrdersListResponse)
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @RateLimit(60, 60)
  @Get("me")
  async getMyOrders(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: ListOrdersDto,
  ): Promise<Response<CommonResponseType<OrdersListResponse>>> {
    try {
      const orders = await this.orderService.getMyOrders(req.user.id, query);

      return responseUtils.success(res, {
        data: orders,
        status: StatusCodes.OK,
        transformWith: OrdersListResponse,
      });
    } catch (error) {
      logger.error("Error fetching user orders:", error);
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(OrderDetailsResponse)
  @UseGuards(RoleGuard(UserRoleEnum.USER))
  @RateLimit(60, 60)
  @Get(":orderId")
  async getOrderDetails(
    @Param("orderId") orderId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<OrderDetailsResponse>>> {
    try {
      const orderDetails = await this.orderService.getOrderDetails(orderId, req.user.id);

      return responseUtils.success(res, {
        data: orderDetails,
        status: StatusCodes.OK,
        transformWith: OrderDetailsResponse,
      });
    } catch (error) {
      logger.error(`Error fetching order details for ID ${orderId}:`, error);
      return responseUtils.error({ res, error });
    }
  }
}
