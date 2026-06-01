import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

import { CartItemResponse } from "./cart-item.response";

export class CartResponse {
  @Expose()
  @ApiPropertyWritable({ nullable: true })
  cartId?: string;

  @Expose()
  @Type(() => CartItemResponse)
  @ApiPropertyWritable({ type: () => CartItemResponse, isArray: true })
  items: CartItemResponse[];

  @Expose()
  @ApiPropertyWritable()
  totalItems: number;

  @Expose()
  @ApiPropertyWritable()
  subtotal: number;
}
