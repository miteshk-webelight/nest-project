import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";
import { VendorStatusEnum } from "../vendors.constants";

export class VendorStatusResponse {
  @Expose()
  @ApiPropertyWritable()
  status: VendorStatusEnum;
}
