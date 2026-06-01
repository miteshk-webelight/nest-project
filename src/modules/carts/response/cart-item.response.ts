import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

export class CartItemResponse {
  @Expose()
  @ApiPropertyWritable()
  productId: string;

  @Expose()
  @ApiPropertyWritable()
  quantity: number;

  @Expose()
  @ApiPropertyWritable()
  priceSnapshot: number;

  @Expose()
  @ApiPropertyWritable({ nullable: true })
  discountPriceSnapshot?: number;

  @Expose()
  @ApiPropertyWritable()
  slugSnapshot: string;

  @Expose()
  @ApiPropertyWritable()
  nameSnapshot: string;

  @Expose()
  @ApiPropertyWritable()
  isAvailable: boolean;

  @Expose()
  @ApiPropertyWritable()
  isOutOfStock: boolean;
}
