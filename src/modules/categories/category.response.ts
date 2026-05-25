import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "../swagger/swagger.writable.decorator";

import type { PaginationMeta } from "../../types/pagination.types";

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
  @ApiPropertyWritable()
  data: CategoryResponse[];

  @Expose()
  @ApiPropertyWritable()
  meta?: PaginationMeta;
}
