import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "src/modules/swagger/swagger.writable.decorator";

export class UserReport {
  @ApiPropertyWritable()
  @Expose()
  totalUsers: number;

  @ApiPropertyWritable()
  @Expose()
  verifiedUsers: number;
}

export class VendorReport {
  @ApiPropertyWritable()
  @Expose()
  totalVendors: number;

  @ApiPropertyWritable()
  @Expose()
  approvedVendors: number;

  @ApiPropertyWritable()
  @Expose()
  pendingVendors: number;

  @ApiPropertyWritable()
  @Expose()
  rejectedVendors: number;
}

export class OrderReport {
  @ApiPropertyWritable()
  @Expose()
  totalOrders: number;

  @ApiPropertyWritable()
  @Expose()
  confirmedOrders: number;

  @ApiPropertyWritable()
  @Expose()
  cancelledOrders: number;

  @ApiPropertyWritable()
  @Expose()
  pendingOrders: number;
}

export class RevenueReport {
  @ApiPropertyWritable()
  @Expose()
  totalRevenue: number;

  @ApiPropertyWritable()
  @Expose()
  refundedAmount: number;

  @ApiPropertyWritable()
  @Expose()
  cashOnDeliveryAmount: number;

  @ApiPropertyWritable()
  @Expose()
  razorpayAmount: number;
}

export class ProductReport {
  @ApiPropertyWritable()
  @Expose()
  totalProducts: number;

  @ApiPropertyWritable()
  @Expose()
  suspendedProducts: number;

  @ApiPropertyWritable()
  @Expose()
  pendingProducts: number;

  @ApiPropertyWritable()
  @Expose()
  approvedProducts: number;
}
