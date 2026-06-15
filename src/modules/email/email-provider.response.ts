import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "../swagger/swagger.writable.decorator";

import { EmailProviderEnum } from "./email.constants";

export class EmailProviderResponse {
  @Expose()
  @ApiPropertyWritable()
  provider: EmailProviderEnum;

  @Expose()
  @ApiPropertyWritable()
  isActive: boolean;
}
