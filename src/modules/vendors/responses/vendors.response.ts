import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "src/modules/swagger/swagger.writable.decorator";

import { VendorStatusEnum } from "../constants/enum";

export class VendorProfileResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  businessName: string;

  @Expose()
  @ApiPropertyWritable()
  businessEmail: string;

  @Expose()
  @ApiPropertyWritable()
  businessPhone: string;

  @Expose()
  @ApiPropertyWritable()
  businessAddress: string;

  @Expose()
  @ApiPropertyWritable()
  logoUrl?: string;

  @Expose()
  @ApiPropertyWritable()
  description?: string;

  @Expose()
  @ApiPropertyWritable()
  status: VendorStatusEnum;

  @Expose()
  @ApiPropertyWritable()
  approvedBy?: string;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;

  @Expose()
  @ApiPropertyWritable()
  updatedAt: Date;
}
