import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { generateSlug, pagination, transformToInstance } from "../../utils/helper.utils";
import { createPaginationMeta } from "../../utils/pagination.utils";
import { DatabaseService } from "../database/database.service";
import { RedisService } from "../redis/redis.service";
import { UsersEntity } from "../users/entity/users.entity";

import {
  CATEGORY_CACHE_TTL,
  CATEGORY_LIST_SELECT_FIELDS,
  CATEGORY_SELECT_FIELDS,
  ERROR_MESSAGES,
} from "./categories.constants";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { ListCategoriesDto } from "./dto/list-categories.dto";
import { UpdateCategoryDto, UpdateCategoryStatusDto } from "./dto/update-category.dto";
import { CategoryEntity } from "./entity/category.entity";
import { CategoryResponse, CategoriesListResponse } from "./responses/category.response";
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

    private readonly redisService: RedisService,

    private readonly databaseService: DatabaseService,
  ) {}

  async createCategory(dto: CreateCategoryDto, admin: UsersEntity): Promise<CategoryEntity> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const categoryRepository = queryRunner.manager.getRepository(CategoryEntity);

      const existingCategory = await categoryRepository
        .createQueryBuilder("category")
        .where("category.name ILIKE :name", { name: dto.name })
        .getOne();

      if (existingCategory) {
        throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
      }

      const slug = generateSlug(dto.name);

      const existingSlug = await categoryRepository
        .createQueryBuilder("category")
        .where("category.slug = :slug", { slug })
        .getOne();

      if (existingSlug) {
        throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
      }

      const category = categoryRepository.create({
        ...dto,
        slug,
        isActive: true,
        createdBy: admin.id,
        updatedBy: admin.id,
      });

      const savedCategory = await categoryRepository.save(category);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearCategoryCache(savedCategory.id, slug);

      return savedCategory;
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      throw error;
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  private async findCategoryById(id: string): Promise<Partial<CategoryEntity>> {
    const category = await this.categoryRepository
      .createQueryBuilder("category")
      .select(CATEGORY_SELECT_FIELDS)
      .where("category.id = :id", { id })
      .getOne();

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return category;
  }

  async getCategoryById(id: string): Promise<Partial<CategoryEntity>> {
    const cacheKey = getCategoryDetailsCacheKey(id);

    const cachedCategory = await this.redisService.get(cacheKey);

    if (cachedCategory) {
      return JSON.parse(cachedCategory) as Partial<CategoryEntity>;
    }

    const category = await this.findCategoryById(id);

    await this.redisService.set(cacheKey, JSON.stringify(category), CATEGORY_CACHE_TTL);

    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Partial<CategoryEntity>> {
    const cacheKey = getCategoryBySlugCacheKey(slug);

    const cachedCategory = await this.redisService.get(cacheKey);

    if (cachedCategory) {
      return JSON.parse(cachedCategory) as Partial<CategoryEntity>;
    }

    const category = await this.categoryRepository
      .createQueryBuilder("category")
      .select(CATEGORY_SELECT_FIELDS)
      .where("category.slug = :slug", { slug })
      .andWhere("category.isActive = :isActive", { isActive: true })
      .getOne();

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    await this.redisService.set(cacheKey, JSON.stringify(category), CATEGORY_CACHE_TTL);

    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, admin: UsersEntity): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const categoryRepository = queryRunner.manager.getRepository(CategoryEntity);

      const category = await categoryRepository
        .createQueryBuilder("category")
        .select(["category.id", "category.name", "category.slug", "category.isActive"])
        .where("category.id = :id", { id })
        .getOne();

      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }

      validateCategoryUpdatePayload(dto);

      if (dto.name) {
        const existingCategory = await categoryRepository
          .createQueryBuilder("category")
          .select(["category.id", "category.name"])
          .where("category.name ILIKE :name", { name: dto.name })
          .andWhere("category.id != :id", { id })
          .getOne();

        validateCategoryUniqueFields(dto, existingCategory);

        const newSlug = generateSlug(dto.name);

        const existingSlug = await categoryRepository
          .createQueryBuilder("category")
          .select(["category.id", "category.slug"])
          .where("category.slug = :slug", { slug: newSlug })
          .andWhere("category.id != :id", { id })
          .getOne();

        if (existingSlug) {
          throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
        }

        category.name = dto.name;
        category.slug = newSlug;
      }
      if (dto.description !== undefined) {
        category.description = dto.description;
      }

      category.updatedBy = admin.id;

      await categoryRepository.save(category);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearCategoryCache(category.id, category.slug);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      throw error;
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const categoryRepository = queryRunner.manager.getRepository(CategoryEntity);

      const category = await categoryRepository.findOne({
        where: { id },
        select: ["id", "slug"],
      });

      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }

      await this.validateCategoryDeletion(id);

      await categoryRepository.softDelete(category.id);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearCategoryCache(category.id, category.slug);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      throw error;
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  private async validateCategoryDeletion(categoryId: string): Promise<void> {
    // Need to Implement product validation when Product module is created
    // Check if category is linked with any products
    // If linked, throw ConflictException(ERROR_MESSAGES.CATEGORY_LINKED_WITH_PRODUCTS)
  }

  async updateCategoryStatus(id: string, dto: UpdateCategoryStatusDto, admin: UsersEntity): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const categoryRepository = queryRunner.manager.getRepository(CategoryEntity);

      const category = await categoryRepository
        .createQueryBuilder("category")
        .select(["category.id", "category.slug", "category.isActive"])
        .where("category.id = :id", { id })
        .getOne();

      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }

      validateCategoryActivationTransition(category.isActive, dto.isActive);

      category.isActive = dto.isActive;
      category.updatedBy = admin.id;

      await categoryRepository.save(category);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearCategoryCache(category.id, category.slug);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      throw error;
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  // Only for admin use, as it lists all categories including inactive ones.
  async listAllCategories(query: ListCategoriesDto): Promise<CategoriesListResponse> {
    const { page = 1, limit = 10, search = "", sortBy = "createdAt", sortOrder = "DESC", isActive } = query;

    const offset = pagination(page, limit);

    const qb = this.categoryRepository.createQueryBuilder("category").select(CATEGORY_LIST_SELECT_FIELDS);

    if (search) {
      qb.andWhere("(category.name ILIKE :search OR category.description ILIKE :search)", { search: `%${search}%` });
    }

    if (isActive !== undefined) {
      qb.andWhere("category.isActive = :isActive", { isActive });
    }

    qb.orderBy(`category.${sortBy}`, sortOrder);

    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: transformToInstance(CategoryResponse, data) as CategoryResponse[],
      meta: createPaginationMeta(page, limit, total),
    };
  }

  // Only lists active categories, used for public listing and selection in other modules.
  async listActiveCategories(query: ListCategoriesDto): Promise<CategoriesListResponse> {
    const { page = 1, limit = 10, search = "", sortBy = "createdAt", sortOrder = "DESC" } = query;

    const offset = pagination(page, limit);

    const cacheParams = `${page}-${limit}-${search}-${sortBy}-${sortOrder}`;
    const cacheKey = getCategoryListCacheKey(cacheParams);

    const cachedList = await this.redisService.get(cacheKey);

    if (cachedList) {
      return JSON.parse(cachedList) as CategoriesListResponse;
    }

    const qb = this.categoryRepository
      .createQueryBuilder("category")
      .select(CATEGORY_LIST_SELECT_FIELDS)
      .where("category.isActive = :isActive", { isActive: true });

    if (search) {
      qb.andWhere("(category.name ILIKE :search OR category.description ILIKE :search)", { search: `%${search}%` });
    }

    qb.orderBy(`category.${sortBy}`, sortOrder);

    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const response = {
      data: transformToInstance(CategoryResponse, data) as CategoryResponse[],
      meta: createPaginationMeta(page, limit, total),
    };

    await this.redisService.set(cacheKey, JSON.stringify(response), CATEGORY_CACHE_TTL);

    return response;
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
