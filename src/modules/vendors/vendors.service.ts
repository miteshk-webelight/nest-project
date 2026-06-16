import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { QueryRunner } from "typeorm";

import { DatabaseService } from "../database/database.service";
import { RedisService } from "../redis/redis.service";
import { UsersEntity } from "../users/entity/users.entity";
import { USER_LIST_SELECT_FIELDS, UserRoleEnum } from "../users/user.constants";

import {
  type VendorDeletedEventPayload,
  type VendorStatusChangedEventPayload,
  VENDOR_STATUS_EVENT_MAP,
  VendorEvents,
} from "./constants/vendor-events";
import { RegisterVendorDto } from "./dto/register-vendor.dto";
import { UpdateVendorProfileDto } from "./dto/update-vendor-profile.dto";
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
    private readonly redisService: RedisService,

    private readonly databaseService: DatabaseService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async registerAsVendor(user: UsersEntity, vendorDto: RegisterVendorDto): Promise<VendorProfileEntity> {
    const registeredVendor = await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const userRepository = queryRunner.manager.getRepository(UsersEntity);
        const existingUser = await userRepository.findOne({
          where: {
            id: user.id,
          },
        });

        if (!existingUser) {
          throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
        }

        const vendorRepository = queryRunner.manager.getRepository(VendorProfileEntity);

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

        return savedVendor;
      },
      errorContext: "Register as vendor",
    });
    await this.clearVendorCache(user.id);

    const adminEmail = await this.getAdminEmail();

    this.eventEmitter.emit(VendorEvents.VENDOR_REGISTERED, {
      vendorId: registeredVendor.id,
      businessName: registeredVendor.businessName,
      businessEmail: registeredVendor.businessEmail,
      ownerEmail: user.email,
      ownerFirstName: user.firstName,
      adminEmail,
    });

    return registeredVendor;
  }

  async updateVendorStatus(vendorId: string, status: VendorStatusEnum, admin: UsersEntity): Promise<void> {
    const vendor = await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
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

        return vendorProfile;
      },
      errorContext: "Update Vendor Status",
    });
    await this.clearVendorCache(vendor.userId);

    const user = await this.databaseService.getRepository(UsersEntity).findOne({ where: { id: vendor.userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const eventPayload = {
      vendorId: vendor.id,
      businessName: vendor.businessName,
      businessEmail: vendor.businessEmail,
      ownerEmail: user.email,
      ownerFirstName: user.firstName,
    } satisfies VendorStatusChangedEventPayload;

    const event = VENDOR_STATUS_EVENT_MAP[status];

    if (event) {
      this.eventEmitter.emit(event, eventPayload);
    }
  }

  private async findVendorByUserId(userId: string): Promise<VendorProfileEntity> {
    const vendor = await this.databaseService
      .getRepository(VendorProfileEntity)
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

  async getMyVendorProfile(user: UsersEntity): Promise<VendorProfileEntity> {
    return this.redisService.getOrSet({
      key: getVendorProfileCacheKey(user.id),
      ttl: VENDOR_CACHE_TTL,
      fetcher: async () => this.findVendorByUserId(user.id),
    });
  }

  async getMyVendorStatus(user: UsersEntity): Promise<{ status: VendorStatusEnum }> {
    return this.redisService.getOrSet({
      key: getVendorStatusCacheKey(user.id),
      ttl: VENDOR_CACHE_TTL,
      fetcher: async () => {
        const vendor = await this.databaseService
          .getRepository(VendorProfileEntity)
          .createQueryBuilder("vendor")
          .select(VENDOR_STATUS_SELECT_FIELDS)
          .where("vendor.userId = :userId", {
            userId: user.id,
          })
          .getOne();

        if (!vendor) {
          throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);
        }

        return {
          status: vendor.status,
        };
      },
    });
  }

  async updateMyVendorProfile(user: UsersEntity, dto: UpdateVendorProfileDto): Promise<void> {
    await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const vendorRepository = queryRunner.manager.getRepository(VendorProfileEntity);

        const userRepository = queryRunner.manager.getRepository(UsersEntity);

        const vendor = await this.findVendorByUserId(user.id);

        await this.validateVendorProfileUpdate(vendor.id, dto);

        Object.assign(vendor, dto);

        // Profile changes require admin re-approval
        vendor.status = VendorStatusEnum.PENDING;
        vendor.approvedBy = undefined;
        vendor.approvedAt = undefined;

        await vendorRepository.save(vendor);

        await userRepository.update({ id: user.id }, { role: UserRoleEnum.USER });
      },
      errorContext: "Update Vendor Profile",
    });

    await this.clearVendorCache(user.id);
  }

  private async getAdminEmail(): Promise<string> {
    const admin = await this.databaseService
      .getRepository(UsersEntity)
      .createQueryBuilder("user")
      .select(USER_LIST_SELECT_FIELDS)
      .where("user.role = :role", { role: UserRoleEnum.ADMIN })
      .getOne();

    return admin?.email ?? "";
  }

  private async clearVendorCache(userId: string): Promise<void> {
    await this.redisService.delete([getVendorProfileCacheKey(userId), getVendorStatusCacheKey(userId)]);
  }

  private async validateVendorProfileUpdate(vendorId: string, dto: UpdateVendorProfileDto): Promise<void> {
    validateVendorProfileUpdatePayload(dto);

    const existingVendor = await this.databaseService
      .getRepository(VendorProfileEntity)
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
    const vendor = await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const vendorRepository = queryRunner.manager.getRepository(VendorProfileEntity);

        const userRepository = queryRunner.manager.getRepository(UsersEntity);

        const vendorProfile = await vendorRepository.findOne({
          where: {
            userId,
          },
        });

        if (!vendorProfile) {
          throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);
        }

        // Remove vendor profile
        await vendorRepository.softDelete(vendorProfile.id);

        // Downgrade role back to normal user
        await userRepository.update(
          {
            id: userId,
          },
          {
            role: UserRoleEnum.USER,
          },
        );

        return {
          id: vendorProfile.id,
          businessName: vendorProfile.businessName,
          businessEmail: vendorProfile.businessEmail,
        };
      },
      errorContext: "Delete Vendor Profile",
    });

    await this.clearVendorCache(userId);

    const user = await this.databaseService.getRepository(UsersEntity).findOne({ where: { id: userId } });

    if (user) {
      this.eventEmitter.emit(VendorEvents.VENDOR_DELETED, {
        vendorId: vendor.id,
        businessName: vendor.businessName,
        businessEmail: vendor.businessEmail,
        ownerEmail: user.email,
        ownerFirstName: user.firstName,
      } satisfies VendorDeletedEventPayload);
    }
  }
}
