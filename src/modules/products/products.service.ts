import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { handleServiceError } from "src/utils/service-error-handler";

import { generateSlug } from "../../utils/helper.utils";
import { CategoryEntity } from "../categories/category.entity";
import { DatabaseService } from "../database/database.service";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { CreateProductDto } from "./dto/create-product.dto";
import { ProductEntity } from "./product.entity";
import { ERROR_MESSAGES, ProductStatusEnum } from "./products.constants";
import {
  validateProductImages,
  validateProductPrice,
  validateProductStock,
  validateSkuUniqueness,
} from "./utils/product-validation.utils";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,

    @InjectRepository(VendorProfileEntity)
    private readonly vendorProfileRepository: Repository<VendorProfileEntity>,

    private readonly databaseService: DatabaseService,
  ) {}

  private async validateCategoryExistsAndActive(categoryId: string): Promise<void> {
    const category = await this.categoryRepository
      .createQueryBuilder("category")
      .select(["category.id", "category.isActive"])
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
    const vendorProfile = await this.vendorProfileRepository
      .createQueryBuilder("vendor")
      .select(["vendor.id"])
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
    validateProductStock(dto.stock);
    validateProductImages(dto.images);

    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const productRepository = queryRunner.manager.getRepository(ProductEntity);

      const vendorId = await this.getVendorProfileId(user.id);

      const existingSku = await productRepository
        .createQueryBuilder("product")
        .select(["product.id"])
        .where("product.vendorId = :vendorId", {
          vendorId,
        })
        .andWhere("product.sku = :sku", {
          sku: dto.sku,
        })
        .getOne();

      validateSkuUniqueness(existingSku);

      const slug = generateSlug(dto.name, true);

      const product = productRepository.create({
        ...dto,
        vendorId,
        slug,
        status: ProductStatusEnum.DRAFT,
        isActive: false,
      });

      const savedProduct = await productRepository.save(product);

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
