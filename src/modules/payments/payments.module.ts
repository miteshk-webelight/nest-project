import { Global, Module } from "@nestjs/common";

import { WorkersModule } from "../workers/workers.module";

import { PaymentEmailEventsListener } from "./listeners/payment-email-events.listener";
import { RazorpayService } from "./razorpay.service";

@Global()
@Module({
  imports: [WorkersModule],
  providers: [RazorpayService, PaymentEmailEventsListener],
  exports: [RazorpayService],
})
export class PaymentsModule {}
