import { SortOrderEnum } from "src/constants/common.constants";

import { ReviewSortEnum } from "../reviews.constants";

import type { RedisService } from "../../redis/redis.service";
import type { GetReviewsByProductDto } from "../dto/get-reviews-by-product.dto";

export const getReviewsByProductCacheKey = (params: string): string => {
  return `reviews:product:${params}`;
};

function buildCacheParamsArray(query: GetReviewsByProductDto): string[] {
  const defaults = {
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortOrder: SortOrderEnum.DESC,
    isPagination: true,
    reviewSortBy: ReviewSortEnum.NEWEST,
  };

  const rating = query.rating === undefined ? "" : String(query.rating);
  return [
    query.productId,
    String(query.page ?? defaults.page),
    String(query.limit ?? defaults.limit),
    query.search ?? defaults.search,
    query.sortBy ?? defaults.sortBy,
    query.sortOrder ?? defaults.sortOrder,
    String(query.isPagination ?? defaults.isPagination),
    query.reviewSortBy ?? defaults.reviewSortBy,
    rating,
  ];
}

export const buildReviewsByProductCacheKey = (query: GetReviewsByProductDto): string => {
  const cacheParams = buildCacheParamsArray(query).join("-");

  return getReviewsByProductCacheKey(cacheParams);
};

export const clearReviewsByProductCache = async (redisService: RedisService, productId: string): Promise<void> => {
  const keys = await redisService.keys(getReviewsByProductCacheKey(`*-${productId}-*`));

  if (keys.length > 0) {
    await redisService.delete(keys);
  }
};
