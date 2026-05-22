export const getVendorProfileCacheKey = (userId: string): string => {
  return `vendor:profile:${userId}`;
};

export const getVendorStatusCacheKey = (userId: string): string => {
  return `vendor:status:${userId}`;
};
