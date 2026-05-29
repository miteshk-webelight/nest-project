import { SortOrderEnum } from "src/constants/common.constants";

import { ProductSortByEnum } from "../products.constants";

import type { RedisService } from "../../redis/redis.service";
import type { GetAllProductDto } from "../dto/get-all-product.dto";

export const getProductDetailsCacheKey = (productId: string, visibility: string): string => {
  return `product:details:${productId}:${visibility}`;
};

export const getProductListCacheKey = (params: string): string => {
  return `product:list:${params}`;
};

export const getApprovedProductListCacheKey = (params: string): string => {
  return `product:list:approved:${params}`;
};

export const buildProductListCacheKey = (query: GetAllProductDto, approved = false): string => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = ProductSortByEnum.CREATED_AT,
    sortOrder = SortOrderEnum.DESC,
    isPagination = true,
    status = "",
    vendorId = "",
    name = "",
  } = query as Required<GetAllProductDto>;

  const cacheParams = [
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    status || "",
    vendorId || "",
    name || "",
    isPagination,
  ].join("-");

  return approved ? getApprovedProductListCacheKey(cacheParams) : getProductListCacheKey(cacheParams);
};

export const clearProductListCache = async (redisService: RedisService): Promise<void> => {
  const adminKeys = await redisService.keys(getProductListCacheKey("*"));
  const approvedKeys = await redisService.keys(getApprovedProductListCacheKey("*"));

  const keysToRemove = [...adminKeys, ...approvedKeys];

  if (keysToRemove.length > 0) {
    await redisService.delete(keysToRemove);
  }
};

export const clearProductDetailsCache = async (redisService: RedisService, productId: string): Promise<void> => {
  const detailKeys = await redisService.keys(getProductDetailsCacheKey(productId, "*"));

  if (detailKeys.length > 0) {
    await redisService.delete(detailKeys);
  }
};
