import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

export class CheckoutResponse {
  @Expose()
  @ApiPropertyWritable()
  orderId: string;

  @Expose()
  @ApiPropertyWritable()
  orderNumber: string;

  @Expose()
  @ApiPropertyWritable()
  totalAmount: number;

  @Expose()
  @ApiPropertyWritable()
  paymentStatus: string;
}
