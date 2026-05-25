import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsIn, IsOptional } from "class-validator";

import { CommonSortByEnum, SortOrderEnum } from "src/constants/common.constants";
import { PaginationQueryDto } from "src/dto/pagination-query.dto";

export class ListCategoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    default: CommonSortByEnum.CREATED_AT,
  })
  @IsOptional()
  @IsIn([CommonSortByEnum.CREATED_AT, CommonSortByEnum.NAME])
  sortBy?: string = CommonSortByEnum.CREATED_AT;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: SortOrderEnum,
    default: SortOrderEnum.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum)
  sortOrder?: SortOrderEnum = SortOrderEnum.DESC;
}
