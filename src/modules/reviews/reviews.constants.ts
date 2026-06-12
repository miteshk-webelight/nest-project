export const REVIEW_CACHE_TTL = 300;

export const ERROR_MESSAGES = {
  REVIEW_NOT_FOUND: "Review not found",
  REVIEWS_NOT_EXISTS_FOR_THE_PRODUCT: "No review yet for this product",
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_NOT_APPROVED: "Product is not approved",
  PRODUCT_NOT_ACTIVE: "Product is not active",
  VENDOR_NOT_APPROVED: "Vendor is not approved",
  ORDER_NOT_DELIVERED: "You can only review products from delivered orders",
  REVIEW_ALREADY_EXISTS: "You have already reviewed this product",
  INVALID_RATING: "Rating must be between 1 and 5",
  INVALID_IMAGES_COUNT: "You can upload maximum 5 images",
  INVALID_MEDIA_IDS: "One or more media IDs are invalid",
  MEDIA_MUST_BE_UNATTACHED: "Media must not be attached to another record",
  YOU_CAN_ONLY_ATTACH_MEDIA_YOU_UPLOADED: "You can only attach media you uploaded",
  UNAUTHORIZED_REVIEW_UPDATE: "You are not authorized to update this review",
  INVALID_REVIEW_UPDATE_PAYLOAD: "Please provide at least one field to update",
  CANNOT_LIKE_YOUR_OWN_REVIEW: "You cannot like your own review",
};

export const SUCCESS_MESSAGES = {
  REVIEW_CREATED: "Review created successfully",
  REVIEW_UPDATED: "Review updated successfully",
  REVIEW_DELETED: "Review deleted successfully",
  REVIEW_LIKED: "Review liked successfully",
  // eslint-disable-next-line @cspell/spellchecker
  REVIEW_UNLIKED: "Review unliked successfully",
};

export const REVIEW_SELECT_FIELDS = {
  ID: ["review.id"],
  BASIC: [
    "review.id",
    "review.userId",
    "review.productId",
    "review.orderItemId",
    "review.title",
    "review.comment",
    "review.rating",
    "review.likesCount",
    "review.createdAt",
    "review.updatedAt",
  ],
  DETAILS: [
    "review.id",
    "review.userId",
    "review.productId",
    "review.orderItemId",
    "review.title",
    "review.comment",
    "review.rating",
    "review.likesCount",
    "review.createdAt",
    "review.updatedAt",
    "user.id",
    "user.firstName",
    "user.lastName",
  ],
  PRODUCT: ["product.id", "product.name", "product.slug", "product.status", "product.isActive"],
  VENDOR: ["vendor.id", "vendor.status"],
  USER: ["user.id"],
  MEDIA: ["media.id", "media.filePath", "media.recordId", "media.module"],
  AVG_RATING: "AVG(review.rating)",
  TOTAL_REVIEW_COUNT: "COUNT(review.id)",
  RATING: "review.rating",
  LIKES: ["like.userId", "like.id", "like.reviewId"],
};

export const REVIEW_CONSTRAINTS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_IMAGES: 5,
};

export enum ReviewSortByEnum {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  RATING = "rating",
  LIKES_COUNT = "likesCount",
}

export enum ReviewSortEnum {
  NEWEST = "NEWEST",
  OLDEST = "OLDEST",
  HIGHEST_RATING = "HIGHEST_RATING",
  LOWEST_RATING = "LOWEST_RATING",
  MOST_LIKED = "MOST_LIKED",
}
