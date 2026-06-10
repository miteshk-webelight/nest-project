import { ApiProperty } from "@nestjs/swagger";

import { IsArray, IsInt, IsNotEmpty, IsOptional, Max, Min } from "class-validator";

import { TrimArrayString } from "src/decorators/trim-array-string.decorator";
import { TrimString } from "src/decorators/trim-string.decorator";

import { REVIEW_CONSTRAINTS } from "../reviews.constants";

export class CreateReviewDto {
  @ApiProperty({ description: "Product ID" })
  @IsNotEmpty()
  @TrimString()
  productId: string;

  @ApiProperty({ description: "Review title" })
  @IsNotEmpty()
  @TrimString()
  title: string;

  @ApiProperty({ description: "Review comment" })
  @IsNotEmpty()
  @TrimString()
  comment: string;

  @ApiProperty({
    description: "Rating (1-5)",
    minimum: REVIEW_CONSTRAINTS.MIN_RATING,
    maximum: REVIEW_CONSTRAINTS.MAX_RATING,
  })
  @IsInt()
  @Min(REVIEW_CONSTRAINTS.MIN_RATING)
  @Max(REVIEW_CONSTRAINTS.MAX_RATING)
  rating: number;

  @ApiProperty({ description: "Media IDs (max 5)", required: false })
  @IsOptional()
  @IsArray()
  @TrimArrayString()
  mediaIds?: string[];
}
