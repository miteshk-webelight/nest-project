import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { QueryRunner } from "typeorm";

import { handleServiceError } from "src/utils/service-error-handler";

import { generateSlug } from "../../utils/helper.utils";
import { CategoryEntity } from "../categories/category.entity";
import { DatabaseService } from "../database/database.service";
import { MediaModuleEnum } from "../media/media.constants";
import { MediaService } from "../media/media.service";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";

import { CreateProductDto } from "./dto/create-product.dto";
import { ProductEntity } from "./product.entity";
import { ProductWithMedia } from "./product.types";
import { ERROR_MESSAGES, PRODUCT_SELECT_FIELDS, ProductStatusEnum } from "./products.constants";
import {
  validateProductPrice,
  validateProductStatusTransition,
  validateSkuUniqueness,
} from "./utils/product-validation.utils";

@Injectable()
export class ProductsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mediaService: MediaService,
  ) {}

  private async validateCategoryExistsAndActive(categoryId: string): Promise<void> {
    const categoryRepository = this.databaseService.getRepository(CategoryEntity);

    const category = await categoryRepository
      .createQueryBuilder("category")
      .select(PRODUCT_SELECT_FIELDS.CATEGORY)
      .where("category.id = :categoryId", { categoryId })
      .getOne();

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (!category.isActive) {
      throw new BadRequestException(ERROR_MESSAGES.CATEGORY_NOT_ACTIVE);
    }
  }

  async createProduct(dto: CreateProductDto, vendorProfile?: VendorProfileEntity): Promise<ProductWithMedia | void> {
    await this.validateCategoryExistsAndActive(dto.categoryId);

    validateProductPrice(dto.price, dto.discountPrice);

    if (!vendorProfile) {
      throw new BadRequestException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
    }

    const queryRunner = await this.databaseService.createQueryRunner();

    await this.mediaService.validateMediaIds(dto.mediaIds, queryRunner);

    try {
      const productRepository = queryRunner.manager.getRepository(ProductEntity);

      const vendorId = vendorProfile.id;

      const existingSku = await productRepository
        .createQueryBuilder("product")
        .select(PRODUCT_SELECT_FIELDS.PRODUCT_ID)
        .where("product.vendorId = :vendorId", {
          vendorId,
        })
        .andWhere("product.sku = :sku", {
          sku: dto.sku,
        })
        .getOne();

      validateSkuUniqueness(existingSku);

      const slug = generateSlug(dto.name, true);

      const { mediaIds, ...productData } = dto;

      const product = productRepository.create({
        ...productData,
        vendorId,
        slug,
        status: ProductStatusEnum.DRAFT,
        isActive: false,
      });

      const savedProduct = await productRepository.save(product);

      await this.mediaService.attachMediaToRecord(mediaIds, MediaModuleEnum.PRODUCT, savedProduct.id, queryRunner);
      await this.databaseService.commitTransaction(queryRunner);
      const media = await this.mediaService.getMediaByRecord(MediaModuleEnum.PRODUCT, savedProduct.id);

      return { ...savedProduct, media };
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      handleServiceError(error, "createProduct");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  private async getProductById(
    productId: string,
    selectFields: string[],
    queryRunner: QueryRunner,
    vendorId?: string,
  ): Promise<ProductEntity | null> {
    const productRepository = queryRunner.manager.getRepository(ProductEntity);

    const query = productRepository
      .createQueryBuilder("product")
      .select(selectFields)
      .where("product.id = :productId", { productId });

    if (vendorId) {
      query.andWhere("product.vendorId = :vendorId", { vendorId });
    }

    return await query.getOne();
  }

  async submitProductApprovalRequest(productId: string, vendorProfile?: VendorProfileEntity): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const productRepository = queryRunner.manager.getRepository(ProductEntity);

      if (!vendorProfile) {
        throw new BadRequestException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
      }

      const vendorId = vendorProfile.id;

      const product = await this.getProductById(productId, PRODUCT_SELECT_FIELDS.STATUS, queryRunner, vendorId);

      if (!product) {
        throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      if (product.status !== ProductStatusEnum.DRAFT) {
        throw new BadRequestException(ERROR_MESSAGES.INVALID_PRODUCT_STATUS_TRANSITION);
      }

      product.status = ProductStatusEnum.PENDING;

      await productRepository.save(product);
      await this.databaseService.commitTransaction(queryRunner);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      handleServiceError(error, "submitProductApprovalRequest");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  async updateProductStatus(productId: string, status: ProductStatusEnum, user: UsersEntity): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const productRepository = queryRunner.manager.getRepository(ProductEntity);

      const product = await this.getProductById(productId, PRODUCT_SELECT_FIELDS.STATUS, queryRunner);

      if (!product) {
        throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      validateProductStatusTransition(product.status, status);

      product.status = status;
      product.reviewedBy = user.id;
      product.reviewedAt = new Date();

      await productRepository.save(product);
      await this.databaseService.commitTransaction(queryRunner);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      handleServiceError(error, "updateProductStatus");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }
}
