import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { QueryRunner, SelectQueryBuilder } from "typeorm";

import { SortOrderEnum } from "src/constants/common.constants";

import { applyPagination, generateSlug } from "../../utils/helper.utils";
import { createPaginationMeta } from "../../utils/pagination.utils";
import { CategoryEntity } from "../categories/category.entity";
import { DatabaseService } from "../database/database.service";
import { MediaModuleEnum } from "../media/media.constants";
import { MediaEntity } from "../media/media.entity";
import { MediaService } from "../media/media.service";
import { RedisService } from "../redis/redis.service";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";
import { VendorStatusEnum } from "../vendors/vendors.constants";

import { CreateProductDto } from "./dto/create-product.dto";
import { GetAllProductDto } from "./dto/get-all-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { resolveProductVisibility } from "./product-access.resolver";
import { ProductEntity } from "./product.entity";
import { ProductListResponse, ProductPublicListResponse } from "./product.response";
import { serializeProductByVisibility, type ProductDetailsResponse } from "./product.serializer";
import { ProductWithMedia } from "./product.types";
import {
  ERROR_MESSAGES,
  PRODUCT_CACHE_TTL,
  PRODUCT_SELECT_FIELDS,
  ProductSortByEnum,
  ProductStatusEnum,
} from "./products.constants";
import {
  buildProductListCacheKey,
  clearProductDetailsCache,
  clearProductListCache,
  getProductDetailsCacheKey,
} from "./utils/product-cache.utils";
import { syncProductMedia, validateProductMediaUpdates } from "./utils/product-media.utils";
import { applyProductUpdates } from "./utils/product-update.utils";
import {
  validateProductPrice,
  validateProductStatusTransition,
  validateProductUpdate,
  validateSkuUniqueness,
  validateUpdatePayload,
} from "./utils/product-validation.utils";

@Injectable()
export class ProductsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mediaService: MediaService,
    private readonly redisService: RedisService,
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

  async getAllProducts(query: GetAllProductDto): Promise<ProductListResponse> {
    const cacheKey = buildProductListCacheKey(query);

    return this.redisService.getOrSet<ProductListResponse>({
      key: cacheKey,
      ttl: PRODUCT_CACHE_TTL,
      fetcher: async () => {
        const qb = this.createProductListQuery(PRODUCT_SELECT_FIELDS.FULL);

        this.applyProductFilters({ qb, query, allowDeleted: true });

        return this.getProductListResponse<ProductListResponse>({
          qb,
          query,
        });
      },
    });
  }

  async getMyProducts(query: GetAllProductDto, vendorProfile?: VendorProfileEntity): Promise<ProductListResponse> {
    if (!vendorProfile) {
      throw new BadRequestException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
    }

    const qb = this.createProductListQuery(PRODUCT_SELECT_FIELDS.FULL);

    this.applyProductFilters({
      qb,
      query: {
        ...query,
        vendorId: vendorProfile.id,
      },
      allowDeleted: true,
    });

    return this.getProductListResponse<ProductListResponse>({
      qb,
      query,
    });
  }

  async getApprovedProducts(query: GetAllProductDto): Promise<ProductPublicListResponse> {
    const cacheKey = buildProductListCacheKey(
      {
        ...query,
        status: undefined,
        vendorId: undefined,
        isDeleted: undefined,
      },
      true,
    );

    return this.redisService.getOrSet<ProductPublicListResponse>({
      key: cacheKey,
      ttl: PRODUCT_CACHE_TTL,
      fetcher: async () => {
        const qb = this.createProductListQuery(PRODUCT_SELECT_FIELDS.PUBLIC_LIST);

        qb.innerJoin("product.vendor", "vendor", "vendor.status = :vendorStatus", {
          vendorStatus: VendorStatusEnum.APPROVED,
        })
          .andWhere("product.status = :status", {
            status: ProductStatusEnum.APPROVED,
          })
          .andWhere("product.isActive = true");

        this.applyProductFilters({
          qb,
          query: {
            ...query,
            status: undefined, // for public listing, we only show approved products, so ignore any status filter from query
            vendorId: undefined, // for public listing, we don't filter by vendorId
          },
        });

        return this.getProductListResponse<ProductPublicListResponse>({
          qb,
          query,
        });
      },
    });
  }

  async getProductById(
    productId: string,
    user?: UsersEntity,
    vendorProfile?: VendorProfileEntity,
  ): Promise<ProductDetailsResponse> {
    const { product, media } = await this.getProductDetailsWithMedia(productId);

    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const visibility = resolveProductVisibility(product, user, vendorProfile);

    const cacheKey = getProductDetailsCacheKey(productId, visibility);

    return this.redisService.getOrSet<ProductDetailsResponse>({
      key: cacheKey,
      ttl: PRODUCT_CACHE_TTL,
      fetcher: () => Promise.resolve(serializeProductByVisibility(product, media, visibility)),
    });
  }

  private createProductListQuery(selectFields: string[]): SelectQueryBuilder<ProductEntity> {
    return this.databaseService
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .select(selectFields)
      .leftJoinAndMapMany(
        "product.media",
        MediaEntity,
        "media",
        "media.recordId = product.id AND media.module = :mediaModule",
        {
          mediaModule: MediaModuleEnum.PRODUCT,
        },
      )
      .addSelect(PRODUCT_SELECT_FIELDS.MEDIA);
  }

  private async getProductDetailsWithMedia(
    productId: string,
  ): Promise<{ product: ProductEntity | null; media: MediaEntity[] }> {
    const product = await this.createProductDetailsQuery().where("product.id = :productId", { productId }).getOne();

    return {
      product,
      media: (product as ProductEntity & { media?: MediaEntity[] }).media ?? [],
    };
  }

  private createProductDetailsQuery(): SelectQueryBuilder<ProductEntity> {
    return this.databaseService
      .getRepository(ProductEntity)
      .createQueryBuilder("product")
      .select(PRODUCT_SELECT_FIELDS.DETAILS)
      .leftJoin("product.vendor", "vendor")
      .leftJoinAndMapMany(
        "product.media",
        MediaEntity,
        "media",
        "media.recordId = product.id AND media.module = :mediaModule",
        {
          mediaModule: MediaModuleEnum.PRODUCT,
        },
      )
      .addSelect(PRODUCT_SELECT_FIELDS.MEDIA);
  }

  private applyProductFilters({
    qb,
    query,
    allowDeleted = false,
  }: {
    qb: SelectQueryBuilder<ProductEntity>;
    query: GetAllProductDto;
    allowDeleted?: boolean;
  }): void {
    const { search, status, vendorId, name, isDeleted } = query;

    if (search) {
      qb.andWhere("product.name ILIKE :search", {
        search: `%${search}%`,
      });
    }

    if (name) {
      qb.andWhere("product.name ILIKE :name", {
        name: `%${name}%`,
      });
    }

    if (status) {
      qb.andWhere("product.status = :status", {
        status,
      });
    }

    if (vendorId) {
      qb.andWhere("product.vendorId = :vendorId", {
        vendorId,
      });
    }

    if (allowDeleted && isDeleted) {
      qb.withDeleted().andWhere("product.deletedAt IS NOT NULL");
    }
  }

  private async getProductListResponse<T extends ProductListResponse | ProductPublicListResponse>({
    qb,
    query,
  }: {
    qb: SelectQueryBuilder<ProductEntity>;
    query: GetAllProductDto;
  }): Promise<T> {
    const {
      page = 1,
      limit = 10,
      sortBy = ProductSortByEnum.CREATED_AT,
      sortOrder = SortOrderEnum.DESC,
      isPagination = true,
    } = query;

    if (!Object.values(ProductSortByEnum).includes(sortBy as ProductSortByEnum)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_SORT_FIELD);
    }

    qb.orderBy(`product.${sortBy}`, sortOrder);

    if (isPagination) {
      applyPagination(qb, {
        page,
        limit,
        isPagination,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: createPaginationMeta(page, limit, total),
    } as unknown as T;
  }

  async createProduct(dto: CreateProductDto, vendorProfile?: VendorProfileEntity): Promise<ProductWithMedia> {
    await this.validateCategoryExistsAndActive(dto.categoryId);

    validateProductPrice(dto.price, dto.discountPrice);

    if (!vendorProfile) {
      throw new BadRequestException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
    }

    const newProduct = await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        await this.mediaService.validateMediaIds(dto.mediaIds, queryRunner);

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
        const media = await this.mediaService.getMediaByRecord(MediaModuleEnum.PRODUCT, savedProduct.id);

        return { ...savedProduct, media };
      },
      errorContext: "Create Product",
    });
    await clearProductListCache(this.redisService);

    return newProduct;
  }

  private async getProductForUpdate(
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
    await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const productRepository = queryRunner.manager.getRepository(ProductEntity);

        if (!vendorProfile) {
          throw new BadRequestException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
        }

        const vendorId = vendorProfile.id;

        const product = await this.getProductForUpdate(productId, PRODUCT_SELECT_FIELDS.STATUS, queryRunner, vendorId);

        if (!product) {
          throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }

        if (product.status !== ProductStatusEnum.DRAFT) {
          throw new BadRequestException(ERROR_MESSAGES.INVALID_PRODUCT_STATUS_TRANSITION);
        }

        product.status = ProductStatusEnum.PENDING;

        await productRepository.save(product);
      },
      errorContext: "Submit Product Approval Request",
    });

    await clearProductListCache(this.redisService);
  }

  async deleteProduct(productId: string, vendorProfile?: VendorProfileEntity): Promise<void> {
    if (!vendorProfile) {
      throw new BadRequestException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
    }

    await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const product = await this.getProductForUpdate(
          productId,
          PRODUCT_SELECT_FIELDS.BASIC,
          queryRunner,
          vendorProfile.id,
        );

        if (!product) {
          throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }

        if (product.status === ProductStatusEnum.SUSPENDED) {
          throw new BadRequestException(ERROR_MESSAGES.SUSPENDED_PRODUCT_CANNOT_DELETED);
        }

        // TODO: we can put extra validation here for cart and active order after cart and order module
        await queryRunner.manager.getRepository(ProductEntity).softDelete(productId);
      },
      errorContext: "Delete Product",
    });

    await clearProductListCache(this.redisService);
    await clearProductDetailsCache(this.redisService, productId);
  }

  async restoreProduct(productId: string, vendorProfile?: VendorProfileEntity): Promise<void> {
    if (!vendorProfile) {
      throw new BadRequestException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
    }

    await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const product = await queryRunner.manager
          .getRepository(ProductEntity)
          .createQueryBuilder("product")
          .withDeleted()
          .where("product.id = :productId", { productId })
          .andWhere("product.vendorId = :vendorId", { vendorId: vendorProfile.id })
          .getOne();

        if (!product) {
          throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }

        if (!product.deletedAt) {
          throw new BadRequestException(ERROR_MESSAGES.PRODUCT_ALREADY_ACTIVE);
        }

        await queryRunner.manager.getRepository(ProductEntity).restore(productId);
      },
      errorContext: "Restore Product",
    });

    await clearProductListCache(this.redisService);
    await clearProductDetailsCache(this.redisService, productId);
  }

  async updateProduct(productId: string, dto: UpdateProductDto, vendorProfile?: VendorProfileEntity): Promise<void> {
    validateUpdatePayload(dto);

    if (!vendorProfile) {
      throw new BadRequestException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
    }

    await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const vendorId = vendorProfile.id;
        const productRepository = queryRunner.manager.getRepository(ProductEntity);

        const product = await this.getProductForUpdate(productId, PRODUCT_SELECT_FIELDS.FULL, queryRunner, vendorId);

        if (!product) {
          throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }

        if (product.status === ProductStatusEnum.SUSPENDED) {
          throw new BadRequestException(ERROR_MESSAGES.PRODUCT_CANNOT_BE_MODIFIED);
        }

        await validateProductMediaUpdates({
          dto,
          productId,
          vendorUserId: vendorProfile.userId,
          mediaService: this.mediaService,
        });

        await validateProductUpdate({
          dto,
          product,
          productId,
          vendorId,
          productRepository,
          validateCategoryExistsAndActive: this.validateCategoryExistsAndActive.bind(this),
        });

        applyProductUpdates(dto, product);

        await productRepository.save(product);

        await syncProductMedia({
          dto,
          productId,
          mediaService: this.mediaService,
          queryRunner,
        });
      },
      errorContext: "Update Product",
    });

    await clearProductListCache(this.redisService);
    await clearProductDetailsCache(this.redisService, productId);
  }

  async updateProductStatus(productId: string, status: ProductStatusEnum, user: UsersEntity): Promise<void> {
    await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const productRepository = queryRunner.manager.getRepository(ProductEntity);

        const product = await this.getProductForUpdate(productId, PRODUCT_SELECT_FIELDS.STATUS, queryRunner);

        if (!product) {
          throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }

        validateProductStatusTransition(product.status, status);

        product.status = status;
        product.reviewedBy = user.id;
        product.reviewedAt = new Date();

        await productRepository.save(product);
      },
      errorContext: "Update product status",
    });
    await clearProductListCache(this.redisService);
  }
}
