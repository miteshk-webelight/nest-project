import { Expose, Type } from "class-transformer";

import { PaginationMetaResponse } from "../../../types/pagination.types";
import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";
import { ProductStatusEnum } from "../products.constants";

export class ProductResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  vendorId: string;

  @Expose()
  @ApiPropertyWritable()
  categoryId: string;

  @Expose()
  @ApiPropertyWritable()
  name: string;

  @Expose()
  @ApiPropertyWritable()
  slug: string;

  @Expose()
  @ApiPropertyWritable()
  sku: string;

  @Expose()
  @ApiPropertyWritable()
  description?: string;

  @Expose()
  @ApiPropertyWritable()
  price: number;

  @Expose()
  @ApiPropertyWritable()
  discountPrice?: number;

  @Expose()
  @ApiPropertyWritable()
  images: string[];

  @Expose()
  @ApiPropertyWritable()
  stock: number;

  @Expose()
  @ApiPropertyWritable()
  status: ProductStatusEnum;

  @Expose()
  @ApiPropertyWritable()
  isActive: boolean;

  @Expose()
  @ApiPropertyWritable()
  approvedBy?: string;

  @Expose()
  @ApiPropertyWritable()
  approvedAt?: Date;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;

  @Expose()
  @ApiPropertyWritable()
  updatedAt: Date;
}

export class ProductPublicResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  vendorId: string;

  @Expose()
  @ApiPropertyWritable()
  categoryId: string;

  @Expose()
  @ApiPropertyWritable()
  name: string;

  @Expose()
  @ApiPropertyWritable()
  slug: string;

  @Expose()
  @ApiPropertyWritable()
  description?: string;

  @Expose()
  @ApiPropertyWritable()
  price: number;

  @Expose()
  @ApiPropertyWritable()
  discountPrice?: number;

  @Expose()
  @ApiPropertyWritable()
  images: string[];

  @Expose()
  @ApiPropertyWritable()
  stock: number;

  @Expose()
  @ApiPropertyWritable()
  isOutOfStock: boolean;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;
}

export class ProductListResponse {
  @Expose()
  @Type(() => ProductResponse)
  @ApiPropertyWritable({ type: () => ProductResponse, isArray: true })
  data: ProductResponse[];

  @Expose()
  @ApiPropertyWritable({
    type: PaginationMetaResponse,
  })
  meta: PaginationMetaResponse;
}

export class ProductPublicListResponse {
  @Expose()
  @Type(() => ProductPublicResponse)
  @ApiPropertyWritable({ type: () => ProductPublicResponse, isArray: true })
  data: ProductPublicResponse[];

  @Expose()
  @ApiPropertyWritable({
    type: PaginationMetaResponse,
  })
  meta: PaginationMetaResponse;
}
