import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";
import { VendorStatusEnum } from "../constants/enum";

export class VendorStatusResponse {
  @Expose()
  @ApiPropertyWritable()
  status: VendorStatusEnum;
}
