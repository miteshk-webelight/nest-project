import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

export class OrderDetailsAddressResponse {
  @Expose()
  @ApiPropertyWritable()
  fullName: string;

  @Expose()
  @ApiPropertyWritable()
  phoneNumber: string;

  @Expose()
  @ApiPropertyWritable()
  address: string;
}

export class OrderItemResponse {
  @Expose()
  @ApiPropertyWritable()
  productId: string;

  @Expose()
  @ApiPropertyWritable()
  nameSnapshot: string;

  @Expose()
  @ApiPropertyWritable()
  slugSnapshot: string;

  @Expose()
  @ApiPropertyWritable()
  skuSnapshot: string;

  @Expose()
  @ApiPropertyWritable()
  quantity: number;

  @Expose()
  @ApiPropertyWritable()
  unitPrice: number;

  @Expose()
  @ApiPropertyWritable()
  totalPrice: number;
}

export class VendorOrderResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  vendorId: string;

  @Expose()
  @ApiPropertyWritable()
  vendorBusinessName: string;

  @Expose()
  @ApiPropertyWritable()
  status: string;

  @Expose()
  @ApiPropertyWritable()
  totalAmount: number;

  @Expose()
  @Type(() => OrderItemResponse)
  @ApiPropertyWritable({ type: () => OrderItemResponse, isArray: true })
  items: OrderItemResponse[];
}

export class OrderDetailsResponse {
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
  paymentMethod: string;

  @Expose()
  @ApiPropertyWritable()
  paymentStatus: string;

  @Expose()
  @ApiPropertyWritable()
  status: string;

  @Expose()
  @ApiPropertyWritable()
  placedAt: Date;

  @Expose()
  @Type(() => OrderDetailsAddressResponse)
  @ApiPropertyWritable({ type: () => OrderDetailsAddressResponse })
  address: OrderDetailsAddressResponse;

  @Expose()
  @Type(() => VendorOrderResponse)
  @ApiPropertyWritable({ type: () => VendorOrderResponse, isArray: true })
  vendorOrders: VendorOrderResponse[];
}
