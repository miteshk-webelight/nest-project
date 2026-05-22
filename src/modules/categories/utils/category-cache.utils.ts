export const getCategoryDetailsCacheKey = (categoryId: string): string => {
  return `category:details:${categoryId}`;
};

export const getCategoryBySlugCacheKey = (slug: string): string => {
  return `category:slug:${slug}`;
};

export const getCategoryListCacheKey = (params: string): string => {
  return `category:list:${params}`;
};
