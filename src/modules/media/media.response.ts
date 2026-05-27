import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "../swagger/swagger.writable.decorator";

export class MediaResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  filePath: string;

  @Expose()
  @ApiPropertyWritable()
  filename: string;

  @Expose()
  @ApiPropertyWritable()
  mimeType: string;

  @Expose()
  @ApiPropertyWritable()
  size: number;

  @Expose()
  @Type(() => Date)
  @ApiPropertyWritable({ type: Date })
  createdAt: Date;
}
