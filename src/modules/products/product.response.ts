import { OmitType } from "@nestjs/swagger";

import { Expose, Type } from "class-transformer";

import { PaginationMetaResponse } from "../../types/pagination.types";
import { MediaResponse } from "../media/media.response";
import { ApiPropertyWritable } from "../swagger/swagger.writable.decorator";

import { ProductStatusEnum } from "./products.constants";

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
  @ApiPropertyWritable({ nullable: true })
  description?: string;

  @Expose()
  @ApiPropertyWritable()
  price: number;

  @Expose()
  @ApiPropertyWritable({ nullable: true })
  discountPrice?: number;

  @Expose()
  @Type(() => MediaResponse)
  @ApiPropertyWritable({ type: () => MediaResponse, isArray: true })
  media: MediaResponse[];

  @Expose()
  @ApiPropertyWritable()
  stock: number;

  @Expose()
  @Type(() => String)
  @ApiPropertyWritable({
    type: String,
    enum: ProductStatusEnum,
  })
  status: ProductStatusEnum;

  @Expose()
  @ApiPropertyWritable()
  isActive: boolean;

  @Expose()
  @ApiPropertyWritable({ nullable: true })
  approvedBy?: string;

  @Expose()
  @Type(() => Date)
  @ApiPropertyWritable({ nullable: true, type: Date })
  approvedAt?: Date;

  @Expose()
  @Type(() => Date)
  @ApiPropertyWritable({
    type: Date,
  })
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  @ApiPropertyWritable({
    type: Date,
  })
  updatedAt: Date;
}

export class ProductPublicResponse extends OmitType(ProductResponse, [
  "sku",
  "status",
  "approvedBy",
  "approvedAt",
  "updatedAt",
] as const) {
  @Expose()
  @ApiPropertyWritable()
  isOutOfStock: boolean;
}

export class ProductListResponse {
  @Expose()
  @Type(() => ProductResponse)
  @ApiPropertyWritable({ type: () => ProductResponse, isArray: true })
  data: ProductResponse[];

  @Expose()
  @Type(() => PaginationMetaResponse)
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
  @Type(() => PaginationMetaResponse)
  @ApiPropertyWritable({
    type: PaginationMetaResponse,
  })
  meta: PaginationMetaResponse;
}
