import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { QueryRunner } from "typeorm";

import { DatabaseService } from "src/modules/database/database.service";
import { MediaService } from "src/modules/media/media.service";
import { OrderItemEntity } from "src/modules/orders/entities/order-item.entity";
import { VendorOrderStatusEnum } from "src/modules/orders/orders.enums";
import { ProductEntity } from "src/modules/products/product.entity";
import { ProductStatusEnum } from "src/modules/products/products.constants";
import { RedisService } from "src/modules/redis/redis.service";
import { VendorStatusEnum } from "src/modules/vendors/vendors.constants";
import { applyPagination } from "src/utils/helper.utils";
import { createPaginationMeta } from "src/utils/pagination.utils";

import { MediaModuleEnum } from "../media/media.constants";
import { MediaEntity } from "../media/media.entity";

import { CreateReviewDto } from "./dto/create-review.dto";
import { GetReviewsByProductDto } from "./dto/get-reviews-by-product.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { ReviewsEntity } from "./entities/reviews.entity";
import { ReviewMedia, ReviewsListResponse } from "./responses/reviews-list.response";
import { ERROR_MESSAGES, REVIEW_CACHE_TTL, REVIEW_SELECT_FIELDS } from "./reviews.constants";
import { buildReviewsByProductCacheKey, clearReviewsByProductCache } from "./utils/review-cache.utils";
import {
  attachReviewMedia,
  validateReviewMedia,
  validateReviewMediaUpdates,
  syncReviewMedia,
  detachReviewMedia,
} from "./utils/review-media.utils";
import {
  applyReviewFilters,
  applyReviewSort,
  buildReviewsListResponse,
  getRatingDistribution,
} from "./utils/review.utils";

import type { GetOrFailMyReviewParams } from "./reviews.types";
import type { PaginationMetaResponse } from "src/types/pagination.types";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mediaService: MediaService,
    private readonly redisService: RedisService,
  ) {}

  async createReview(userId: string, dto: CreateReviewDto): Promise<ReviewsEntity> {
    await validateReviewMedia({
      mediaIds: dto.mediaIds,
      userId,
      mediaService: this.mediaService,
    });

    const product = await this.validateAndGetProductForReview(dto.productId);

    const orderItem = await this.validateAndGetOrderItemForReview(userId, dto.productId);

    const existingReview = await this.checkExistingReview(userId, dto.productId);

    if (existingReview) {
      throw new BadRequestException(ERROR_MESSAGES.REVIEW_ALREADY_EXISTS);
    }

    const newReview = await this.databaseService.executeTransaction({
      operation: async (queryRunner) => {
        const review = queryRunner.manager.create(ReviewsEntity, {
          userId,
          productId: product.id,
          orderItemId: orderItem.id,
          title: dto.title,
          comment: dto.comment,
          rating: dto.rating,
          likesCount: 0,
        });

        const savedReview = await queryRunner.manager.save(review);

        await attachReviewMedia({
          mediaIds: dto.mediaIds,
          reviewId: savedReview.id,
          mediaService: this.mediaService,
          queryRunner,
        });

        await this.updateProductRating(queryRunner, dto.productId);

        return savedReview;
      },
      errorContext: "Create Review",
    });

    await clearReviewsByProductCache(this.redisService, dto.productId);

    return newReview;
  }

  private async getOrFailMyReview({ queryRunner, userId, reviewId }: GetOrFailMyReviewParams): Promise<ReviewsEntity> {
    const review = await queryRunner.manager
      .getRepository(ReviewsEntity)
      .createQueryBuilder("review")
      .where("review.id = :reviewId", { reviewId })
      .getOne();

    if (!review) {
      throw new NotFoundException(ERROR_MESSAGES.REVIEW_NOT_FOUND);
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(ERROR_MESSAGES.UNAUTHORIZED_REVIEW_UPDATE);
    }

    return review;
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto): Promise<ReviewsEntity> {
    const keys = Object.keys(dto) as (keyof UpdateReviewDto)[];
    if (keys.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_REVIEW_UPDATE_PAYLOAD);
    }

    const updatedReview = await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const reviewRepository = queryRunner.manager.getRepository(ReviewsEntity);

        const review = await this.getOrFailMyReview({ queryRunner, userId, reviewId });

        await validateReviewMediaUpdates({
          dto,
          reviewId,
          userId,
          mediaService: this.mediaService,
        });

        const ratingChanged = dto.rating !== undefined && dto.rating !== review.rating;

        review.rating = dto.rating ?? review.rating;
        review.comment = dto.comment ?? review.comment;
        review.title = dto.title ?? review.title;

        const savedReview = await reviewRepository.save(review);

        await syncReviewMedia({
          dto,
          reviewId,
          mediaService: this.mediaService,
          queryRunner,
        });

        if (ratingChanged) {
          await this.updateProductRating(queryRunner, review.productId);
        }

        return savedReview;
      },
      errorContext: "Update Review",
    });

    await clearReviewsByProductCache(this.redisService, updatedReview.productId);

    return updatedReview;
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const deletedReview = await this.databaseService.executeTransaction({
      errorContext: "Delete Review",
      operation: async (queryRunner: QueryRunner) => {
        const review = await this.getOrFailMyReview({
          queryRunner,
          userId,
          reviewId,
        });

        const medias = await this.getMediasByReviewIds([reviewId]);

        if (medias.length) {
          const mediaIds = medias.map(({ id }) => id);

          await detachReviewMedia({
            mediaIds,
            mediaService: this.mediaService,
            queryRunner,
          });
        }

        await queryRunner.manager.remove(ReviewsEntity, review);
        await this.updateProductRating(queryRunner, review.productId);

        return review;
      },
    });

    await clearReviewsByProductCache(this.redisService, deletedReview.productId);
  }

  private async validateAndGetProductForReview(productId: string): Promise<ProductEntity> {
    const product = await this.databaseService
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .innerJoin("product.vendor", "vendor")
      .select(REVIEW_SELECT_FIELDS.PRODUCT)
      .addSelect(REVIEW_SELECT_FIELDS.VENDOR)
      .where(
        "product.id = :productId AND product.status = :status AND product.isActive = true AND vendor.status = :vendorStatus",
        {
          productId,
          status: ProductStatusEnum.APPROVED,
          vendorStatus: VendorStatusEnum.APPROVED,
        },
      )
      .getOne();

    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  private async validateAndGetOrderItemForReview(userId: string, productId: string): Promise<OrderItemEntity> {
    const orderItem = await this.databaseService
      .getRepository(OrderItemEntity)
      .createQueryBuilder("orderItem")
      .innerJoin("orderItem.vendorOrder", "vendorOrder")
      .innerJoin("vendorOrder.order", "order")
      .andWhere(
        "orderItem.productId = :productId AND order.userId = :userId AND vendorOrder.status = :vendorOrderStatus ",
        {
          productId,
          userId,
          vendorOrderStatus: VendorOrderStatusEnum.DELIVERED,
        },
      )
      .getOne();

    if (!orderItem) {
      throw new BadRequestException(ERROR_MESSAGES.ORDER_NOT_DELIVERED);
    }

    return orderItem;
  }

  private async checkExistingReview(userId: string, productId: string): Promise<ReviewsEntity | null> {
    return this.databaseService
      .getRepository(ReviewsEntity)
      .createQueryBuilder("review")
      .where("review.userId = :userId AND review.productId = :productId", { userId, productId })
      .getOne();
  }

  private async updateProductRating(queryRunner: QueryRunner, productId: string): Promise<void> {
    const result = await queryRunner.manager
      .createQueryBuilder(ReviewsEntity, "review")
      .select(REVIEW_SELECT_FIELDS.AVG_RATING, "avgRating")
      .addSelect(REVIEW_SELECT_FIELDS.TOTAL_REVIEW_COUNT, "reviewCount")
      .where("review.productId = :productId", { productId })
      .getRawOne();

    const avgRating = Number((Number.parseFloat(result.avgRating) || 0).toFixed(2));
    const reviewCount = Number.parseInt(result.reviewCount) || 0;

    await queryRunner.manager.update(ProductEntity, productId, {
      averageRating: avgRating,
      reviewCount,
    });
  }

  async getReviewsByProduct(query: GetReviewsByProductDto): Promise<ReviewsListResponse> {
    const cacheKey = buildReviewsByProductCacheKey(query);

    return this.redisService.getOrSet<ReviewsListResponse>({
      key: cacheKey,
      ttl: REVIEW_CACHE_TTL,
      fetcher: async () => {
        const product = await this.getProductForReviews(query.productId);

        const reviews = await this.fetchReviews(query);

        if (!reviews.length) throw new NotFoundException(ERROR_MESSAGES.REVIEWS_NOT_EXISTS_FOR_THE_PRODUCT);

        const reviewIds = reviews.map(({ id }) => id);
        const medias = await this.getMediasByReviewIds(reviewIds);

        const ratingDistribution = await this.fetchRatingDistribution(query.productId);

        const meta = query.isPagination ? await this.buildPaginationMeta(query) : undefined;

        return buildReviewsListResponse({
          product,
          reviews,
          ratingDistribution,
          medias: medias as ReviewMedia[],
          meta,
        });
      },
    });
  }

  private async getProductForReviews(productId: string): Promise<ProductEntity> {
    const product = await this.databaseService
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .select(REVIEW_SELECT_FIELDS.PRODUCT)
      .where("product.id = :productId", { productId })
      .getOne();

    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  private async fetchReviews(query: GetReviewsByProductDto): Promise<ReviewsEntity[]> {
    const qb = this.databaseService
      .getRepository(ReviewsEntity)
      .createQueryBuilder("review")
      .leftJoin("review.user", "user")
      .select(REVIEW_SELECT_FIELDS.DETAILS);

    applyReviewFilters(qb, query);
    applyReviewSort(qb, query.reviewSortBy);

    if (query.isPagination) {
      applyPagination(qb, query);
    }

    return qb.getMany();
  }

  private async fetchRatingDistribution(productId: string): Promise<Record<string, number>> {
    const qb = this.databaseService.getRepository(ReviewsEntity).createQueryBuilder("review");

    return getRatingDistribution(productId, qb);
  }

  private async getMediasByReviewIds(reviewIds: string[]): Promise<MediaEntity[]> {
    const medias = await this.databaseService
      .getRepository(MediaEntity)
      .createQueryBuilder("media")
      .select(REVIEW_SELECT_FIELDS.MEDIA)
      .where("media.module = :module AND media.recordId IN (:...reviewIds)", {
        module: MediaModuleEnum.REVIEW,
        reviewIds,
      })
      .getMany();

    return medias;
  }

  private async buildPaginationMeta(query: GetReviewsByProductDto): Promise<PaginationMetaResponse> {
    const qb = this.databaseService
      .getRepository(ReviewsEntity)
      .createQueryBuilder("review")
      .select(REVIEW_SELECT_FIELDS.ID);

    applyReviewFilters(qb, query);

    const total = await qb.getCount();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return createPaginationMeta(page, limit, total);
  }
}
