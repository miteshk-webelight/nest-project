import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsBooleanString, IsEnum, IsIn, IsOptional, IsString } from "class-validator";

import { UserRoleEnum, VendorStatusEnum } from "../constants/enum";

export class FindAllUsersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

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
    default: "createdAt",
  })
  @IsOptional()
  @IsIn(["createdAt", "firstName", "email"])
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";

  @ApiPropertyOptional({
    default: 1,
  })
  @Transform(({ value }) => Number(value))
  page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
  })
  @Transform(({ value }) => Number(value))
  limit?: number = 10;
}
