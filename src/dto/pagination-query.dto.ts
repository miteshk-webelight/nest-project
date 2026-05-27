import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, MaxLength, Min } from "class-validator";

import { SortOrderEnum } from "src/constants/common.constants";
import { TrimString } from "src/decorators/trim-string.decorator";

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: true })
  @Transform(({ value }) => value !== "false")
  @IsBoolean()
  @IsOptional()
  isPagination?: boolean = true;

  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional()
  @TrimString()
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: SortOrderEnum,
    default: SortOrderEnum.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum)
  sortOrder?: SortOrderEnum = SortOrderEnum.DESC;

  @ApiPropertyOptional()
  @TrimString()
  @MaxLength(100)
  @IsOptional()
  sortBy?: string;
}
