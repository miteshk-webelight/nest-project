import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { transformToInstance } from "src/utils/helper.utils";

import { RedisService } from "../redis/redis.service";
import { UserRoleEnum } from "../users/constants/enum";
import { UsersEntity } from "../users/entity/users.entity";

import { VENDOR_CACHE_TTL } from "./constants/cache.constants";
import { VendorStatusEnum } from "./constants/enum";
import { ERROR_MESSAGES } from "./constants/messages";
import { RegisterVendorDto } from "./dto/register-vendor.dto";
import { UpdateVendorProfileDto } from "./dto/update-vendor-profile.dto";
import { VendorProfileResponse } from "./responses/vendors.response";
import { getVendorProfileCacheKey, getVendorStatusCacheKey } from "./utils/vendor-cache.utils";
import { VendorProfileEntity } from "./vendor.profile.entity";

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(VendorProfileEntity)
    private readonly vendorProfileRepository: Repository<VendorProfileEntity>,

    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,

    private readonly redisService: RedisService,
  ) {}

  async registerAsVendor(user: UsersEntity, vendorDto: RegisterVendorDto): Promise<VendorProfileEntity> {
    return this.userRepository.manager.transaction(async (manager) => {
      const existingUser = await manager.getRepository(UsersEntity).findOne({
        where: {
          id: user.id,
        },
      });

      if (!existingUser) {
        throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      const existingApplication = await manager
        .getRepository(VendorProfileEntity)
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

      const vendorProfile = manager.getRepository(VendorProfileEntity).create({
        ...vendorDto,
        userId: existingUser.id,
        status: VendorStatusEnum.PENDING,
      });

      const savedVendor = await manager.getRepository(VendorProfileEntity).save(vendorProfile);

      await this.clearVendorCache(existingUser.id);

      return savedVendor;
    });
  }

  async updateVendorStatus(vendorId: string, status: VendorStatusEnum, admin: UsersEntity): Promise<void> {
    const vendorProfile = await this.vendorProfileRepository
      .createQueryBuilder("vendor")
      .where("vendor.id = :vendorId", {
        vendorId,
      })
      .getOne();

    if (!vendorProfile) {
      throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);
    }

    vendorProfile.status = status;

    vendorProfile.approvedBy = status === VendorStatusEnum.APPROVED ? admin.id : undefined;

    await this.vendorProfileRepository.save(vendorProfile);

    // Sync user role with vendor approval status
    await this.userRepository.update(
      {
        id: vendorProfile.userId,
      },
      {
        role: status === VendorStatusEnum.APPROVED ? UserRoleEnum.VENDOR : UserRoleEnum.USER,
      },
    );

    await this.clearVendorCache(vendorProfile.userId);
  }

  private async findVendorByUserId(userId: string): Promise<VendorProfileEntity> {
    const vendor = await this.vendorProfileRepository
      .createQueryBuilder("vendor")
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

    const vendor = await this.findVendorByUserId(user.id);

    const response = {
      status: vendor.status,
    };

    await this.redisService.set(cacheKey, JSON.stringify(response), VENDOR_CACHE_TTL);

    return response;
  }

  async updateMyVendorProfile(user: UsersEntity, dto: UpdateVendorProfileDto): Promise<void> {
    const vendor = await this.findVendorByUserId(user.id);
    Object.assign(vendor, dto);

    // Profile changes require admin re-approval
    vendor.status = VendorStatusEnum.PENDING;
    vendor.approvedBy = undefined;

    await this.vendorProfileRepository.save(vendor);

    await this.userRepository.update({ id: user.id }, { role: UserRoleEnum.USER });

    await this.clearVendorCache(user.id);
  }

  private async clearVendorCache(userId: string): Promise<void> {
    await this.redisService.delete([getVendorProfileCacheKey(userId), getVendorStatusCacheKey(userId)]);
  }

  async deleteVendorProfile(userId: string): Promise<void> {
    await this.userRepository.manager.transaction(async (manager) => {
      const vendor = await manager.getRepository(VendorProfileEntity).findOne({
        where: {
          userId,
        },
      });

      if (!vendor) {
        throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);
      }

      // Remove vendor profile
      await manager.getRepository(VendorProfileEntity).softDelete(vendor.id);

      // Downgrade role back to normal user
      await manager.getRepository(UsersEntity).update(
        {
          id: userId,
        },
        {
          role: UserRoleEnum.USER,
        },
      );
    });

    await this.clearVendorCache(userId);
  }
}
