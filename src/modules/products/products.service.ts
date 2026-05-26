import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { handleServiceError } from "src/utils/service-error-handler";

import { generateSlug } from "../../utils/helper.utils";
import { CategoryEntity } from "../categories/category.entity";
import { DatabaseService } from "../database/database.service";
import { MediaService } from "../media/media.service";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { CreateProductDto } from "./dto/create-product.dto";
import { ProductEntity } from "./product.entity";
import { ERROR_MESSAGES, PRODUCT_SELECT_FIELDS, ProductStatusEnum } from "./products.constants";
import { validateProductPrice, validateSkuUniqueness } from "./utils/product-validation.utils";

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

  private async getVendorProfileId(userId: string): Promise<string> {
    const vendorRepository = this.databaseService.getRepository(VendorProfileEntity);

    const vendorProfile = await vendorRepository
      .createQueryBuilder("vendor")
      .select(PRODUCT_SELECT_FIELDS.VENDOR_ID)
      .where("vendor.userId = :userId", { userId })
      .andWhere("vendor.status = :status", {
        status: VendorStatusEnum.APPROVED,
      })
      .getOne();

    if (!vendorProfile) {
      throw new NotFoundException(ERROR_MESSAGES.VENDOR_PROFILE_NOT_FOUND);
    }

    return vendorProfile.id;
  }

  async createProduct(dto: CreateProductDto, user: UsersEntity): Promise<ProductEntity | void> {
    await this.validateCategoryExistsAndActive(dto.categoryId);

    validateProductPrice(dto.price, dto.discountPrice);

    const queryRunner = await this.databaseService.createQueryRunner();

    await this.mediaService.validateMediaIds(dto.mediaIds, queryRunner);

    try {
      const productRepository = queryRunner.manager.getRepository(ProductEntity);

      const vendorId = await this.getVendorProfileId(user.id);

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

      await this.mediaService.attachMediaToProduct(mediaIds, savedProduct.id, queryRunner);
      await this.databaseService.commitTransaction(queryRunner);

      return savedProduct;
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      handleServiceError(error, "createProduct");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }
}
