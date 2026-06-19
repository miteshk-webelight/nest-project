import { SortOrderEnum } from "src/constants/common.constants";

import { REVIEW_SELECT_FIELDS, ReviewSortEnum } from "../reviews.constants";

import type { GetReviewsByProductDto } from "../dto/get-reviews-by-product.dto";
import type { ReviewsEntity } from "../entities/reviews.entity";
import type { ReviewMedia, ReviewsListResponse } from "../responses/reviews-list.response";
import type { ProductEntity } from "src/modules/products/product.entity";
import type { PaginationMetaResponse } from "src/types/pagination.types";
import type { SelectQueryBuilder } from "typeorm";

export function applyReviewSort(qb: SelectQueryBuilder<ReviewsEntity>, reviewSortBy?: ReviewSortEnum): void {
  if (!reviewSortBy) {
    return;
  }

  switch (reviewSortBy) {
    case ReviewSortEnum.NEWEST:
      qb.orderBy("review.createdAt", SortOrderEnum.DESC);
      break;
    case ReviewSortEnum.OLDEST:
      qb.orderBy("review.createdAt", SortOrderEnum.ASC);
      break;
    case ReviewSortEnum.HIGHEST_RATING:
      qb.orderBy("review.rating", SortOrderEnum.DESC);
      break;
    case ReviewSortEnum.LOWEST_RATING:
      qb.orderBy("review.rating", SortOrderEnum.ASC);
      break;
    case ReviewSortEnum.MOST_LIKED:
      qb.orderBy("review.likesCount", SortOrderEnum.DESC);
      break;
    default:
      qb.orderBy("review.createdAt", SortOrderEnum.DESC);
  }
}

export async function getRatingDistribution(
  productId: string,
  qb: SelectQueryBuilder<ReviewsEntity>,
): Promise<Record<string, number>> {
  const result = await qb
    .select(REVIEW_SELECT_FIELDS.RATING, "rating")
    .addSelect(REVIEW_SELECT_FIELDS.TOTAL_REVIEW_COUNT, "count")
    .where("review.productId = :productId", { productId })
    .groupBy(REVIEW_SELECT_FIELDS.RATING)
    .getRawMany();

  const distribution: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };

  for (const row of result) {
    distribution[row.rating] = Number.parseInt(row.count);
  }

  return distribution;
}

export function applyReviewFilters(qb: SelectQueryBuilder<ReviewsEntity>, query: GetReviewsByProductDto): void {
  if (query.productId) {
    qb.andWhere("review.productId = :productId", { productId: query.productId });
  }

  if (query.rating) {
    qb.andWhere("review.rating = :rating", { rating: query.rating });
  }
}

export function buildReviewsListResponse({
  product,
  reviews,
  ratingDistribution,
  medias = [],
  meta,
}: {
  product: ProductEntity;
  reviews: ReviewsEntity[];
  ratingDistribution: Record<string, number>;
  medias: ReviewMedia[];
  meta?: PaginationMetaResponse;
}): ReviewsListResponse {
  const mediaMap = new Map<string, ReviewMedia[]>();

  for (const media of medias) {
    if (!mediaMap.has(media.recordId)) {
      mediaMap.set(media.recordId, []);
    }
    mediaMap.get(media.recordId)!.push(media);
  }

  return {
    data: reviews.map((review) => ({
      id: review.id,
      user: {
        id: review.user.id,
        fullName: `${review.user.firstName} ${review.user.lastName ?? ""}`.trim(),
        avatar: review.user.avatarUrl,
      },
      productId: review.productId,
      orderItemId: review.orderItemId,
      title: review.title,
      comment: review.comment,
      rating: review.rating,
      likesCount: review.likesCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      media: mediaMap.get(review.id) ?? [],
    })),
    meta,
    summary: {
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      ratingDistribution: ratingDistribution as { "1": number; "2": number; "3": number; "4": number; "5": number },
    },
  };
}
