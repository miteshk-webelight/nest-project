import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "src/modules/swagger/swagger.writable.decorator";

export class DownloadSignedUrlDto {
  @Expose()
  @ApiPropertyWritable()
  url: string;
}
