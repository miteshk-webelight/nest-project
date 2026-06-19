import { OmitType } from "@nestjs/swagger";

import { Expose, Transform, Type } from "class-transformer";

import { PaginationMetaResponse } from "../../types/pagination.types";
import { MediaResponse } from "../media/media.response";
import { ApiPropertyWritable } from "../swagger/swagger.writable.decorator";

import { ProductStatusEnum } from "./products.constants";

export class VendorInfo {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  storeName: string;
}

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
  @Type(() => VendorInfo)
  @ApiPropertyWritable({ type: () => VendorInfo })
  vendor: VendorInfo;

  @Expose()
  @ApiPropertyWritable()
  averageRating: number;

  @Expose()
  @ApiPropertyWritable()
  reviewCount: number;

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
  @Type(() => Date)
  @ApiPropertyWritable({ nullable: true, type: Date })
  reviewedAt?: Date;

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

export class ProductAdminResponse extends ProductResponse {
  @Expose()
  @ApiPropertyWritable({ nullable: true })
  reviewedBy?: string;

  @Expose()
  @ApiPropertyWritable({ nullable: true })
  createdBy?: string;

  @Expose()
  @ApiPropertyWritable({ nullable: true })
  updatedBy?: string;
}

export class ProductVendorResponse extends ProductResponse {}

export class ProductPublicResponse extends OmitType(ProductResponse, [
  "vendorId",
  "sku",
  "status",
  "reviewedAt",
  "createdAt",
  "stock",
  "isActive",
  "updatedAt",
] as const) {
  @Expose()
  @Transform(({ obj }) => obj.stock <= 0)
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
