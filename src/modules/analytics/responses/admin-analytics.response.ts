import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "src/modules/swagger/swagger.writable.decorator";

import { OrderReport, ProductReport, RevenueReport, UserReport, VendorReport } from "./analytics-reports.response";

export { OrderReport, ProductReport, RevenueReport, UserReport, VendorReport } from "./analytics-reports.response";

export class AdminAnalyticsResponse {
  @Type(() => UserReport)
  @Expose()
  @ApiPropertyWritable({ type: () => UserReport })
  users: UserReport;

  @Type(() => VendorReport)
  @Expose()
  @ApiPropertyWritable({ type: () => VendorReport })
  vendors: VendorReport;

  @Type(() => ProductReport)
  @Expose()
  @ApiPropertyWritable({ type: () => ProductReport })
  products: ProductReport;

  @Type(() => OrderReport)
  @Expose()
  @ApiPropertyWritable({ type: () => OrderReport })
  orders: OrderReport;

  @Type(() => RevenueReport)
  @Expose()
  @ApiPropertyWritable({ type: () => RevenueReport })
  revenue: RevenueReport;
}
