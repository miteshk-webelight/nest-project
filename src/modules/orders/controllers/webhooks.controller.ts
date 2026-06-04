import { Controller, Headers, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";

import { ApiTag } from "src/constants/api-tags.constants";
import { Public } from "src/decorators/public.decorator";
import { MessageResponse } from "src/modules/swagger/dtos/response.dtos";
import { ApiSwaggerResponse } from "src/modules/swagger/swagger.decorator";
import { logger } from "src/services/logger.service";
import responseUtils, { CommonResponseType } from "src/utils/response.utils";

import { PAYMENT_STATUS_RAZORPAY, RAZORPAY_HEADER_SIGNATURE_KEY, SUCCESS_MESSAGES } from "../orders.constants";
import { RazorpayWebhookPayload, RazorpayWebhookEvent } from "../orders.interface";
import { WebhookService } from "../services/webhook.service";

@ApiTags(ApiTag.Webhook)
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @ApiSwaggerResponse(MessageResponse)
  @Post("razorpay")
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Headers(RAZORPAY_HEADER_SIGNATURE_KEY) signature: string,
    @Res() res: Response,
  ): Promise<Response<CommonResponseType<MessageResponse>>> {
    try {
      const payload = req.body as RazorpayWebhookPayload;

      const rawBody = req.rawBody instanceof Buffer ? req.rawBody.toString("utf8") : JSON.stringify(payload);
      const webhookEvent: RazorpayWebhookEvent = {
        event: payload.event,
        razorpayOrderId: payload.payload.payment.entity.order_id,
        razorpayPaymentId: payload.payload.payment.entity.id,
        amount: payload.payload.payment.entity.amount,
      };

      const { event } = webhookEvent;

      switch (event) {
        case PAYMENT_STATUS_RAZORPAY.CAPTURED:
          await this.webhookService.processPaymentCaptured(webhookEvent, rawBody, signature);
          break;
        case PAYMENT_STATUS_RAZORPAY.FAILED:
          await this.webhookService.processPaymentFailed(webhookEvent);
          break;
        default:
          logger.info("Unhandled webhook event :  ", webhookEvent.event);
          break;
      }

      return responseUtils.success(res, {
        data: { message: SUCCESS_MESSAGES.WEBHOOK_PROCESSED },
        status: StatusCodes.OK,
      });
    } catch (error) {
      logger.error("Error processing Razorpay webhook:", error);
      return responseUtils.error({ res, error });
    }
  }
}
