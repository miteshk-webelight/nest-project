import { Expose, Type } from "class-transformer";

import { PaginationMetaResponse } from "src/types/pagination.types";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

import { ReviewResponse } from "./review.response";

export class ReviewMedia {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  filePath: string;

  @Expose()
  @ApiPropertyWritable()
  recordId: string;
}

export class ReviewWithMediaResponse extends ReviewResponse {
  @Expose()
  @Type(() => ReviewMedia)
  @ApiPropertyWritable({ type: () => ReviewMedia, isArray: true, nullable: true })
  media?: ReviewMedia[];
}

export class RatingDistribution {
  @Expose()
  @ApiPropertyWritable()
  "1": number;

  @Expose()
  @ApiPropertyWritable()
  "2": number;

  @Expose()
  @ApiPropertyWritable()
  "3": number;

  @Expose()
  @ApiPropertyWritable()
  "4": number;

  @Expose()
  @ApiPropertyWritable()
  "5": number;
}

export class ReviewSummary {
  @Expose()
  @ApiPropertyWritable()
  averageRating: number;

  @Expose()
  @ApiPropertyWritable()
  reviewCount: number;

  @Expose()
  @Type(() => RatingDistribution)
  @ApiPropertyWritable({ type: () => RatingDistribution })
  ratingDistribution: RatingDistribution;
}

export class ReviewsListResponse {
  @Expose()
  @Type(() => ReviewWithMediaResponse)
  @ApiPropertyWritable({ type: () => ReviewWithMediaResponse, isArray: true })
  data: ReviewWithMediaResponse[];

  @Expose()
  @Type(() => ReviewSummary)
  @ApiPropertyWritable({ type: () => ReviewSummary })
  summary: ReviewSummary;

  @Expose()
  @Type(() => PaginationMetaResponse)
  @ApiPropertyWritable({ type: () => PaginationMetaResponse, nullable: true })
  meta?: PaginationMetaResponse;
}
