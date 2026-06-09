import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "src/modules/swagger/swagger.writable.decorator";

import { OrderReport, ProductReport, RevenueReport } from "./analytics-reports.response";

export class TopProductReport {
  @ApiPropertyWritable()
  @Expose()
  productId: string;

  @ApiPropertyWritable()
  @Expose()
  productName: string;

  @ApiPropertyWritable()
  @Expose()
  soldQuantity: number;
}

export class VendorAnalyticsResponse {
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

  @Type(() => TopProductReport)
  @Expose()
  @ApiPropertyWritable({ type: () => TopProductReport, isArray: true })
  topProducts: TopProductReport[];
}
