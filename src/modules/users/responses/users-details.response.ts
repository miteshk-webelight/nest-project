import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "../../../modules/swagger/swagger.writable.decorator";
import { VendorStatusEnum } from "../../../modules/vendors/vendors.constants";
import { UserRoleEnum } from "../user.constants";

class VendorProfileResponse {
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
}

export class UserDetailsResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  firstName: string;

  @Expose()
  @ApiPropertyWritable()
  lastName?: string;

  @Expose()
  @ApiPropertyWritable()
  email: string;

  @Expose()
  @ApiPropertyWritable()
  phoneNumber: string;

  @Expose()
  @ApiPropertyWritable()
  avatarUrl?: string;

  @Expose()
  @ApiPropertyWritable()
  role: UserRoleEnum;

  @Expose()
  @ApiPropertyWritable()
  isEmailVerified: boolean;

  @Expose()
  @ApiPropertyWritable()
  deletedAt: Date;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;

  @Expose()
  @ApiPropertyWritable()
  updatedAt: Date;

  @Expose()
  @Type(() => VendorProfileResponse)
  @ApiPropertyWritable({
    type: VendorProfileResponse,
    isArray: true,
  })
  vendorProfiles: VendorProfileResponse[];
}
