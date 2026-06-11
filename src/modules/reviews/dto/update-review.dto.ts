import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsArray, IsInt, IsOptional, Max, Min, IsString } from "class-validator";

import { TrimArrayString } from "src/decorators/trim-array-string.decorator";
import { TrimString } from "src/decorators/trim-string.decorator";

import { REVIEW_CONSTRAINTS } from "../reviews.constants";

export class UpdateReviewDto {
  @ApiProperty({
    description: "Rating (1-5)",
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(REVIEW_CONSTRAINTS.MIN_RATING)
  @Max(REVIEW_CONSTRAINTS.MAX_RATING)
  rating?: number;

  @ApiProperty({ description: "Review comment" })
  @IsOptional()
  @TrimString()
  comment?: string;

  @ApiProperty({ description: "Review Title" })
  @IsOptional()
  @TrimString()
  title?: string;

  @ApiProperty({ description: "Removed media IDs", type: [String] })
  @IsOptional()
  @IsArray()
  @TrimArrayString()
  removedMediaIds?: string[];

  @ApiProperty({ description: "New media IDs to add", type: [String] })
  @IsOptional()
  @IsArray()
  @TrimArrayString()
  newMediaIds?: string[];
}
