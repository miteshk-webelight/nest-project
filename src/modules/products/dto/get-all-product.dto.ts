import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsEnum, IsOptional, MaxLength } from "class-validator";

import { SortOrderEnum } from "src/constants/common.constants";
import { TrimString } from "src/decorators/trim-string.decorator";
import { PaginationQueryDto } from "src/dto/pagination-query.dto";

import { ProductSortByEnum, ProductStatusEnum } from "../products.constants";

export class GetAllProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ProductStatusEnum,
  })
  @IsOptional()
  @IsEnum(ProductStatusEnum)
  status?: ProductStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  @TrimString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    enum: SortOrderEnum,
    default: SortOrderEnum.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum)
  sortOrder?: SortOrderEnum = SortOrderEnum.DESC;

  @ApiPropertyOptional({
    enum: ProductSortByEnum,
    default: ProductSortByEnum.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProductSortByEnum)
  sortBy?: ProductSortByEnum = ProductSortByEnum.CREATED_AT;
}
