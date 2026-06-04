import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

export class PaymentResponse {
  @Expose()
  @ApiPropertyWritable()
  orderId: string;

  @Expose()
  @ApiPropertyWritable()
  razorpayOrderId: string;

  @Expose()
  @ApiPropertyWritable()
  amount: number;
}
