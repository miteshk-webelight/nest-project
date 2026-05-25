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
  @ApiPropertyWritable()
  page: number;

  @ApiPropertyWritable()
  limit: number;

  @ApiPropertyWritable()
  total: number;

  @ApiPropertyWritable()
  totalPages: number;

  @ApiPropertyWritable()
  hasNextPage: boolean;

  @ApiPropertyWritable()
  hasPreviousPage: boolean;
}
