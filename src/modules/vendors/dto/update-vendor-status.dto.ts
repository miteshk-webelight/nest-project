import { ApiProperty } from "@nestjs/swagger";

import { IsIn, IsNotEmpty } from "class-validator";

import { VendorStatusEnum } from "../constants/enum";

export class UpdateVendorStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsIn([VendorStatusEnum.APPROVED, VendorStatusEnum.REJECTED, VendorStatusEnum.SUSPENDED])
  status: Exclude<VendorStatusEnum, VendorStatusEnum.PENDING>;
}
