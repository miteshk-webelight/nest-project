import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { QueryRunner } from "typeorm";

import { DatabaseService } from "src/modules/database/database.service";
import { MediaService } from "src/modules/media/media.service";
import { OrderItemEntity } from "src/modules/orders/entities/order-item.entity";
import { VendorOrderStatusEnum } from "src/modules/orders/orders.enums";
import { ProductEntity } from "src/modules/products/product.entity";
import { ProductStatusEnum } from "src/modules/products/products.constants";
import { VendorStatusEnum } from "src/modules/vendors/vendors.constants";

import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewsEntity } from "./entities/reviews.entity";
import { ERROR_MESSAGES, REVIEW_SELECT_FIELDS } from "./reviews.constants";
import { attachReviewMedia, validateReviewMedia } from "./utils/review-media.utils";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mediaService: MediaService,
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

    return newReview;
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
}
