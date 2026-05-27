import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsBooleanString, IsEnum, IsOptional } from "class-validator";

import { PaginationQueryDto } from "src/dto/pagination-query.dto";

import { VendorStatusEnum } from "../../vendors/vendors.constants";
import { UserRoleEnum } from "../user.constants";

export class FindAllUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: UserRoleEnum,
  })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  isDeleted?: string;

  @ApiPropertyOptional({
    enum: VendorStatusEnum,
  })
  @IsOptional()
  @IsEnum(VendorStatusEnum)
  vendorStatus?: VendorStatusEnum;
}
