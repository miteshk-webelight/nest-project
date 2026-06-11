import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, Max, Min } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";
import { PaginationQueryDto } from "src/dto/pagination-query.dto";

import { ReviewSortEnum } from "../reviews.constants";

export class GetReviewsByProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Product ID" })
  @IsNotEmpty()
  @TrimString()
  productId: string;

  @ApiPropertyOptional({ enum: ReviewSortEnum, description: "Sort reviews by" })
  @IsEnum(ReviewSortEnum)
  @IsOptional()
  reviewSortBy?: ReviewSortEnum;

  @ApiPropertyOptional({ description: "Filter by rating (1-5)" })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
