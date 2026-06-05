import { Expose, Type } from "class-transformer";

import { PaginationMetaResponse } from "src/types/pagination.types";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

import { OrderDetailsAddressResponse } from "./order-details.response";

export class OrderListItemResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  orderNumber: string;

  @Expose()
  @ApiPropertyWritable()
  totalAmount: number;

  @Expose()
  @ApiPropertyWritable()
  status: string;

  @Expose()
  @ApiPropertyWritable()
  paymentStatus: string;

  @Expose()
  @ApiPropertyWritable()
  paymentMethod: string;

  @Expose()
  @ApiPropertyWritable()
  placedAt: Date;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;

  @Expose()
  @Type(() => OrderDetailsAddressResponse)
  @ApiPropertyWritable({ type: () => OrderDetailsAddressResponse })
  address: OrderDetailsAddressResponse;
}

export class OrdersListResponse {
  @Expose()
  @Type(() => OrderListItemResponse)
  @ApiPropertyWritable({ type: () => OrderListItemResponse, isArray: true })
  data: OrderListItemResponse[];

  @Expose()
  @Type(() => PaginationMetaResponse)
  @ApiPropertyWritable({ type: () => PaginationMetaResponse })
  meta?: PaginationMetaResponse;
}
