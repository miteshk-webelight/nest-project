import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "src/modules/swagger/swagger.writable.decorator";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class PaginationMetaResponse {
  @Expose()
  @ApiPropertyWritable()
  page: number;

  @Expose()
  @ApiPropertyWritable()
  limit: number;

  @Expose()
  @ApiPropertyWritable()
  total: number;

  @Expose()
  @ApiPropertyWritable()
  totalPages: number;

  @Expose()
  @ApiPropertyWritable()
  hasNextPage: boolean;

  @Expose()
  @ApiPropertyWritable()
  hasPreviousPage: boolean;
}
