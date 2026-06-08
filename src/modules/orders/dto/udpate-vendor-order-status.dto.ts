import { ApiProperty } from "@nestjs/swagger";

import { IsEnum, IsNotEmpty } from "class-validator";

import { VendorOrderStatusEnum } from "../orders.enums";

export class UpdateVendorOrderStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(VendorOrderStatusEnum)
  status: VendorOrderStatusEnum;
}
