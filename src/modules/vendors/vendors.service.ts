import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { transformToInstance } from "src/utils/helper.utils";

import { DatabaseService } from "../database/database.service";
import { RedisService } from "../redis/redis.service";
import { UsersEntity } from "../users/entity/users.entity";
import { UserRoleEnum } from "../users/user.constants";

import { RegisterVendorDto } from "./dto/register-vendor.dto";
import { UpdateVendorProfileDto } from "./dto/update-vendor-profile.dto";
import { VendorProfileResponse } from "./responses/vendors.response";
import { getVendorProfileCacheKey, getVendorStatusCacheKey } from "./utils/vendor-cache.utils";
import { validateVendorStatusTransition } from "./utils/vendor-status.utils";
import { validateVendorProfileUpdatePayload, validateVendorUniqueFields } from "./utils/vendor-validation.utils";
import { VendorProfileEntity } from "./vendor.profile.entity";
import {
  ERROR_MESSAGES,
  VENDOR_CACHE_TTL,
  VENDOR_PROFILE_SELECT_FIELDS,
  VENDOR_STATUS_SELECT_FIELDS,
  VENDOR_STATUS_UPDATE_SELECT_FIELDS,
  VendorStatusEnum,
} from "./vendors.constants";

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(VendorProfileEntity)
    private readonly vendorProfileRepository: Repository<VendorProfileEntity>,

    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,

    private readonly redisService: RedisService,

    private readonly databaseService: DatabaseService,
  ) {}

  async registerAsVendor(user: UsersEntity, vendorDto: RegisterVendorDto): Promise<VendorProfileEntity> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const userRepository = queryRunner.manager.getRepository(UsersEntity);

      const vendorRepository = queryRunner.manager.getRepository(VendorProfileEntity);

      const existingUser = await userRepository.findOne({
        where: {
          id: user.id,
        },
      });

      if (!existingUser) {
        throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      const existingApplication = await vendorRepository
        .createQueryBuilder("vendor")
        .where("vendor.userId = :userId", {
          userId: existingUser.id,
        })
        // Prevent multiple active vendor applications
        .andWhere("vendor.status IN (:...statuses)", {
          statuses: [VendorStatusEnum.PENDING, VendorStatusEnum.APPROVED, VendorStatusEnum.SUSPENDED],
        })
        .getOne();

      if (existingApplication) {
        throw new ConflictException(ERROR_MESSAGES.VENDOR_APPLICATION_ALREADY_EXISTS);
      }

      const vendorProfile = vendorRepository.create({
        ...vendorDto,
        userId: existingUser.id,
        status: VendorStatusEnum.PENDING,
      });

      const savedVendor = await vendorRepository.save(vendorProfile);

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearVendorCache(existingUser.id);

      return savedVendor;
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      throw error;
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  async updateVendorStatus(vendorId: string, status: VendorStatusEnum, admin: UsersEntity): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const vendorRepository = queryRunner.manager.getRepository(VendorProfileEntity);

      const userRepository = queryRunner.manager.getRepository(UsersEntity);

      const vendorProfile = await vendorRepository
        .createQueryBuilder("vendor")
        .select(VENDOR_STATUS_UPDATE_SELECT_FIELDS)
        .where("vendor.id = :vendorId", {
          vendorId,
        })
        .getOne();

      if (!vendorProfile) {
        throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);
      }

      validateVendorStatusTransition(vendorProfile.status, status);

      vendorProfile.status = status;

      if (status === VendorStatusEnum.APPROVED) {
        vendorProfile.approvedBy = admin.id;
        vendorProfile.approvedAt = new Date();
      } else {
        vendorProfile.approvedBy = undefined;
        vendorProfile.approvedAt = undefined;
      }

      await vendorRepository.save(vendorProfile);

      await userRepository.update(
        {
          id: vendorProfile.userId,
        },
        {
          role: status === VendorStatusEnum.APPROVED ? UserRoleEnum.VENDOR : UserRoleEnum.USER,
        },
      );

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearVendorCache(vendorProfile.userId);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      throw error;
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  private async findVendorByUserId(userId: string): Promise<VendorProfileEntity> {
    const vendor = await this.vendorProfileRepository
      .createQueryBuilder("vendor")
      .select(VENDOR_PROFILE_SELECT_FIELDS)
      .where("vendor.userId = :userId", {
        userId,
      })
      .getOne();

    if (!vendor) {
      throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);
    }

    return vendor;
  }

  async getMyVendorProfile(user: UsersEntity): Promise<VendorProfileResponse> {
    const cacheKey = getVendorProfileCacheKey(user.id);

    const cachedVendor = await this.redisService.get(cacheKey);

    if (cachedVendor) {
      return JSON.parse(cachedVendor) as VendorProfileResponse;
    }

    const vendor = await this.findVendorByUserId(user.id);

    const transformedVendor = transformToInstance(VendorProfileResponse, vendor) as VendorProfileResponse;

    await this.redisService.set(cacheKey, JSON.stringify(transformedVendor), VENDOR_CACHE_TTL);

    return transformedVendor;
  }

  async getMyVendorStatus(user: UsersEntity): Promise<{ status: VendorStatusEnum }> {
    const cacheKey = getVendorStatusCacheKey(user.id);

    const cachedStatus = await this.redisService.get(cacheKey);

    if (cachedStatus) {
      return JSON.parse(cachedStatus) as {
        status: VendorStatusEnum;
      };
    }

    const vendor = await this.vendorProfileRepository
      .createQueryBuilder("vendor")
      .select(VENDOR_STATUS_SELECT_FIELDS)
      .where("vendor.userId = :userId", {
        userId: user.id,
      })
      .getOne();

    if (!vendor) {
      throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);
    }

    const response = {
      status: vendor.status,
    };

    await this.redisService.set(cacheKey, JSON.stringify(response), VENDOR_CACHE_TTL);

    return response;
  }

  async updateMyVendorProfile(user: UsersEntity, dto: UpdateVendorProfileDto): Promise<void> {
    const vendor = await this.findVendorByUserId(user.id);

    await this.validateVendorProfileUpdate(vendor.id, dto);

    Object.assign(vendor, dto);

    // Profile changes require admin re-approval
    vendor.status = VendorStatusEnum.PENDING;
    vendor.approvedBy = undefined;
    vendor.approvedAt = undefined;

    await this.vendorProfileRepository.save(vendor);

    await this.userRepository.update({ id: user.id }, { role: UserRoleEnum.USER });

    await this.clearVendorCache(user.id);
  }

  private async clearVendorCache(userId: string): Promise<void> {
    await this.redisService.delete([getVendorProfileCacheKey(userId), getVendorStatusCacheKey(userId)]);
  }

  private async validateVendorProfileUpdate(vendorId: string, dto: UpdateVendorProfileDto): Promise<void> {
    validateVendorProfileUpdatePayload(dto);

    const existingVendor = await this.vendorProfileRepository
      .createQueryBuilder("vendor")
      .select(["vendor.id", "vendor.businessEmail", "vendor.businessPhone"])
      .where(
        `
        (
          vendor.businessEmail = :businessEmail
          OR vendor.businessPhone = :businessPhone
        )
      `,
        {
          businessEmail: dto.businessEmail ?? "",
          businessPhone: dto.businessPhone ?? "",
        },
      )
      .andWhere("vendor.id != :vendorId", {
        vendorId,
      })
      .getOne();

    validateVendorUniqueFields(dto, existingVendor);
  }

  async deleteVendorProfile(userId: string): Promise<void> {
    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      const vendorRepository = queryRunner.manager.getRepository(VendorProfileEntity);

      const userRepository = queryRunner.manager.getRepository(UsersEntity);

      const vendor = await vendorRepository.findOne({
        where: {
          userId,
        },
      });

      if (!vendor) {
        throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);
      }

      // Remove vendor profile
      await vendorRepository.softDelete(vendor.id);

      // Downgrade role back to normal user
      await userRepository.update(
        {
          id: userId,
        },
        {
          role: UserRoleEnum.USER,
        },
      );

      await this.databaseService.commitTransaction(queryRunner);

      await this.clearVendorCache(userId);
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);
      throw error;
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }
}
