import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsBooleanString, IsEnum, IsOptional } from "class-validator";

import { SortOrderEnum } from "src/constants/common.constants";
import { PaginationQueryDto } from "src/dto/pagination-query.dto";

import { VendorStatusEnum } from "../../vendors/vendors.constants";
import { UserRoleEnum, UserSortByEnum } from "../user.constants";

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

  @ApiPropertyOptional({
    enum: SortOrderEnum,
    default: SortOrderEnum.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum)
  sortOrder?: SortOrderEnum = SortOrderEnum.DESC;

  @ApiPropertyOptional({
    enum: UserSortByEnum,
    default: UserSortByEnum.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(UserSortByEnum)
  sortBy?: UserSortByEnum = UserSortByEnum.CREATED_AT;
}
