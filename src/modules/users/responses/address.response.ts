import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "../../../modules/swagger/swagger.writable.decorator";

export class UserAddressDto {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  fullName: string;

  @Expose()
  @ApiPropertyWritable()
  phoneNumber: string;

  @Expose()
  @ApiPropertyWritable()
  addressLine1: string;

  @Expose()
  @ApiPropertyWritable({ required: false })
  addressLine2?: string;

  @Expose()
  @ApiPropertyWritable()
  city: string;

  @Expose()
  @ApiPropertyWritable()
  state: string;

  @Expose()
  @ApiPropertyWritable()
  country: string;

  @Expose()
  @ApiPropertyWritable()
  postalCode: string;

  @Expose()
  @ApiPropertyWritable()
  createdBy: string;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;

  @Expose()
  @ApiPropertyWritable()
  updatedAt: Date;
}

export class UserAddressesResponse {
  @Expose()
  @Type(() => UserAddressDto)
  @ApiPropertyWritable({
    type: UserAddressDto,
    isArray: true,
  })
  addresses: UserAddressDto[];
}
