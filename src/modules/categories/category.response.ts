import { Expose, Type } from "class-transformer";

import { PaginationMetaResponse } from "src/types/pagination.types";

import { ApiPropertyWritable } from "../swagger/swagger.writable.decorator";

export class CategoryResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

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
  isActive: boolean;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;

  @Expose()
  @ApiPropertyWritable()
  updatedAt: Date;
}

export class CategoriesListResponse {
  @Expose()
  @Type(() => CategoryResponse)
  @ApiPropertyWritable({ type: () => CategoryResponse, isArray: true })
  data: CategoryResponse[];

  @Expose()
  @ApiPropertyWritable({ type: () => PaginationMetaResponse })
  meta?: PaginationMetaResponse;
}
