import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository, SelectQueryBuilder } from "typeorm";

import { CommonSortByEnum, SortOrderEnum } from "src/constants/common.constants";
import { handleServiceError } from "src/utils/service-error-handler";

import { applyPagination, generateSlug } from "../../utils/helper.utils";
import { createPaginationMeta } from "../../utils/pagination.utils";
import { DatabaseService } from "../database/database.service";
import { ProductEntity } from "../products/product.entity";
import { PRODUCT_SELECT_FIELDS } from "../products/products.constants";
import { RedisService } from "../redis/redis.service";
import { UsersEntity } from "../users/entity/users.entity";

import { CATEGORY_CACHE_TTL, CATEGORY_SELECT_FIELDS, ERROR_MESSAGES } from "./categories.constants";
import { CategoryAdminActionParams } from "./category-service.types";
import { CategoryEntity } from "./category.entity";
import { CategoriesListResponse } from "./category.response";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { ListCategoriesDto } from "./dto/list-categories.dto";
import { UpdateCategoryDto, UpdateCategoryStatusDto } from "./dto/update-category.dto";
import {
  getCategoryBySlugCacheKey,
  getCategoryDetailsCacheKey,
  getCategoryListCacheKey,
} from "./utils/category-cache.utils";
import {
  validateCategoryActivationTransition,
  validateCategoryUniqueFields,
  validateCategoryUpdatePayload,
} from "./utils/category-validation.utils";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    private readonly redisService: RedisService,

    private readonly databaseService: DatabaseService,
  ) {}

  async createCategory(dto: CreateCategoryDto, admin: UsersEntity): Promise<CategoryEntity | void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const categoryRepository = queryRunner.manager.getRepository(CategoryEntity);

      const slug = generateSlug(dto.name);

      const existingCategory = await categoryRepository
        .createQueryBuilder("category")
        .where("category.name LIKE :name", { name: dto.name })
        .orWhere("category.slug = :slug", { slug })
        .getOne();

      if (existingCategory) {
        throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
      }

      const category = categoryRepository.create({
        ...dto,
        slug,
        isActive: true,
      });

      const savedCategory = await categoryRepository.save(category);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearCategoryCache(savedCategory.id, slug);

      return savedCategory;
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      handleServiceError(error, "createCategoryError");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  private async findCategoryById(id: string): Promise<Partial<CategoryEntity>> {
    const category = await this.categoryRepository
      .createQueryBuilder("category")
      .select(CATEGORY_SELECT_FIELDS.DETAILS)
      .where("category.id = :id", { id })
      .getOne();

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return category;
  }

  async getCategoryById(id: string): Promise<Partial<CategoryEntity>> {
    return this.redisService.getOrSet({
      key: getCategoryDetailsCacheKey(id),
      ttl: CATEGORY_CACHE_TTL,
      fetcher: async () => this.findCategoryById(id),
    });
  }

  async getCategoryBySlug(slug: string): Promise<Partial<CategoryEntity>> {
    return this.redisService.getOrSet({
      key: getCategoryBySlugCacheKey(slug),
      ttl: CATEGORY_CACHE_TTL,
      fetcher: async () => {
        const category = await this.categoryRepository
          .createQueryBuilder("category")
          .select(CATEGORY_SELECT_FIELDS.DETAILS)
          .where("category.slug = :slug", { slug })
          .andWhere("category.isActive = :isActive", {
            isActive: true,
          })
          .getOne();

        if (!category) {
          throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }

        return category;
      },
    });
  }

  async updateCategory({ id, dto, admin }: CategoryAdminActionParams<UpdateCategoryDto>): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const categoryRepository = queryRunner.manager.getRepository(CategoryEntity);

      const category = await categoryRepository
        .createQueryBuilder("category")
        .select(CATEGORY_SELECT_FIELDS.MAIN)
        .where("category.id = :id", { id })
        .getOne();

      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }

      validateCategoryUpdatePayload(dto);

      if (dto.name) {
        const newSlug = generateSlug(dto.name);

        const existingCategory = await categoryRepository
          .createQueryBuilder("category")
          .select(["category.id", "category.name"])
          .where("category.name LIKE :name", { name: dto.name })
          .andWhere("category.id != :id", { id })
          .andWhere("category.slug = :slug", { slug: newSlug })
          .getOne();

        validateCategoryUniqueFields(dto, existingCategory);

        if (existingCategory) {
          throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
        }

        Object.assign(category, { name: dto.name, slug: newSlug });
      }
      if (dto.description !== undefined) {
        category.description = dto.description;
      }

      await categoryRepository.save(category);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearCategoryCache(category.id, category.slug);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      handleServiceError(error, "updateCategoryError");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const categoryRepository = queryRunner.manager.getRepository(CategoryEntity);

      const category = await categoryRepository
        .createQueryBuilder("category")
        .select(["category.id"])
        .where("category.id = :id", { id })
        .getOne();

      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }

      await this.validateCategoryDeletion(id);

      await categoryRepository.softDelete(category.id);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearCategoryCache(category.id, category.slug);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      handleServiceError(error, "deleteCategoryError");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  private async validateCategoryDeletion(categoryId: string): Promise<void> {
    const productCount = await this.productRepository
      .createQueryBuilder("product")
      .select(PRODUCT_SELECT_FIELDS.ID)
      .where("product.categoryId = :categoryId", { categoryId })
      .getCount();

    if (productCount > 0) {
      throw new ConflictException(ERROR_MESSAGES.CATEGORY_LINKED_WITH_PRODUCTS);
    }
  }

  async updateCategoryStatus({ id, dto, admin }: CategoryAdminActionParams<UpdateCategoryStatusDto>): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const categoryRepository = queryRunner.manager.getRepository(CategoryEntity);

      const category = await categoryRepository
        .createQueryBuilder("category")
        .select(CATEGORY_SELECT_FIELDS.MAIN)
        .where("category.id = :id", { id })
        .getOne();

      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }

      validateCategoryActivationTransition(category.isActive, dto.isActive);

      category.isActive = dto.isActive;

      await categoryRepository.save(category);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearCategoryCache(category.id, category.slug);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);

      handleServiceError(error, "createCategoryStatusUpdateError");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  async listCategories({
    query,
    onlyActive = false,
  }: {
    query: ListCategoriesDto;
    onlyActive?: boolean;
  }): Promise<CategoriesListResponse> {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = CommonSortByEnum.CREATED_AT,
      sortOrder = SortOrderEnum.DESC,
      isActive,
      isPagination = true,
    } = query;

    const cacheParams = [page, limit, search, sortBy, sortOrder, isActive, onlyActive, isPagination].join("-");

    const cacheKey = getCategoryListCacheKey(cacheParams);

    return this.redisService.getOrSet({
      key: cacheKey,
      ttl: CATEGORY_CACHE_TTL,
      fetcher: async () => {
        const qb = this.categoryRepository.createQueryBuilder("category").select(CATEGORY_SELECT_FIELDS.LIST);

        this.applyCategoryFilters({
          qb,
          search,
          onlyActive,
          isActive,
        });

        qb.orderBy(`category.${sortBy}`, sortOrder);

        applyPagination(qb, {
          page,
          limit,
          isPagination,
        });

        return this.getCategoryListResponse({
          qb,
          page,
          limit,
          isPagination,
        });
      },
    });
  }

  private applyCategoryFilters({
    qb,
    search,
    onlyActive,
    isActive,
  }: {
    qb: SelectQueryBuilder<CategoryEntity>;
    search?: string;
    onlyActive?: boolean;
    isActive?: boolean;
  }): void {
    if (onlyActive) {
      qb.where("category.isActive = :isActive", {
        isActive: true,
      });
    } else if (typeof isActive === "boolean") {
      qb.where("category.isActive = :isActive", {
        isActive,
      });
    }

    if (search) {
      qb.andWhere("(category.name ILIKE :search OR category.description ILIKE :search)", {
        search: `%${search}%`,
      });
    }
  }

  private async getCategoryListResponse({
    qb,
    page,
    limit,
    isPagination,
  }: {
    qb: SelectQueryBuilder<CategoryEntity>;
    page: number;
    limit: number;
    isPagination: boolean;
  }): Promise<CategoriesListResponse> {
    if (!isPagination) {
      const data = await qb.getMany();

      return {
        data,
      };
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  private async clearCategoryCache(categoryId: string, slug: string): Promise<void> {
    await this.redisService.delete([getCategoryDetailsCacheKey(categoryId), getCategoryBySlugCacheKey(slug)]);
    // clear category list cache as well since it can be affected by both status and name changes
    const listCacheKeys = await this.redisService.keys(getCategoryListCacheKey("*"));
    if (listCacheKeys.length > 0) {
      await this.redisService.delete(listCacheKeys);
    }
  }
}
