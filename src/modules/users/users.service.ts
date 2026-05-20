import crypto from "crypto";

import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { pagination, transformToInstance } from "../../utils/helper.utils";
import { createPaginationMeta } from "../../utils/pagination.utils";

import { UserRoleEnum, VendorStatusEnum } from "./constants/enum";
import { ERROR_MESSAGES } from "./constants/message";
import { FindAllUsersDto } from "./dto/find-all-users.dto";
import { UserDetailsResponse } from "./users-details.response";
import { CreateAdminDto, CreateUserDto, RegisterVendorDto } from "./users.dto";
import { UsersEntity } from "./users.entity";
import { UsersListResponse, UsersResponse } from "./users.response";
import { VendorProfileEntity } from "./vendor.profile.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
    @InjectRepository(VendorProfileEntity)
    private readonly vendorProfileRepository: Repository<VendorProfileEntity>,
  ) {}

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const iterations = 120_000;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");

    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

  async create(user: CreateUserDto, role: UserRoleEnum = UserRoleEnum.USER): Promise<UsersEntity> {
    const existingUser = await this.userRepository
      .createQueryBuilder("user")
      .where("user.email ILIKE :email", { email: user.email })
      .getOne();
    if (existingUser) throw new ConflictException(ERROR_MESSAGES.USER_ALREADY_EXISTS);

    const newUser = this.userRepository.create({
      ...user,
      role,
      password: this.hashPassword(user.password),
    });

    return this.userRepository.save(newUser);
  }

  async createAdmin(user: CreateAdminDto, currentUser: UsersEntity): Promise<UsersEntity> {
    return this.create(user, UserRoleEnum.ADMIN);
  }

  async findAll(query: FindAllUsersDto): Promise<UsersListResponse> {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      isDeleted,
      vendorStatus,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = query;

    const offset = pagination(page, limit);

    const qb = this.userRepository.createQueryBuilder("user").leftJoinAndSelect("user.vendorProfiles", "vendorProfile");

    // Search
    if (search) {
      qb.andWhere(
        `
        (
          user.firstName ILIKE :search
          OR user.lastName ILIKE :search
          OR user.email ILIKE :search
        )
        `,
        { search: `%${search}%` },
      );
    }

    // Role
    if (role) {
      qb.andWhere("user.role = :role", {
        role,
      });
    }

    // soft delete
    if (isDeleted !== undefined) {
      qb.andWhere("user.isDeleted = :isDeleted", {
        isDeleted: isDeleted === "true",
      });
    }

    // vendor status
    if (vendorStatus) {
      qb.andWhere("vendorProfile.status = :vendorStatus", {
        vendorStatus,
      });
    }

    // sorting
    qb.orderBy(`user.${sortBy}`, sortOrder);

    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: transformToInstance(UsersResponse, data) as UsersResponse[],
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<UserDetailsResponse> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.vendorProfiles", "vendorProfiles")
      .where("user.id = :id", { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return transformToInstance(UserDetailsResponse, user) as UserDetailsResponse;
  }

  async registerAsVendor(user: UsersEntity, vendorDto: RegisterVendorDto): Promise<VendorProfileEntity> {
    return this.userRepository.manager.transaction(async (manager) => {
      const existingUser = await manager
        .getRepository(UsersEntity)
        .createQueryBuilder("user")
        .setLock("pessimistic_write")
        .where("user.id = :id", { id: user.id })
        .getOne();

      if (!existingUser) {
        throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      const existingApplication = await manager
        .getRepository(VendorProfileEntity)
        .createQueryBuilder("vendor")
        .setLock("pessimistic_write")
        .where("vendor.userId = :userId", {
          userId: existingUser.id,
        })
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

      return manager.getRepository(VendorProfileEntity).save(vendorProfile);
    });
  }

  async updateVendorStatus(vendorId: string, status: VendorStatusEnum, admin: UsersEntity): Promise<void> {
    if (admin.role !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ONLY);
    }

    const vendorProfile = await this.vendorProfileRepository
      .createQueryBuilder("vendor")
      .where("vendor.id = :vendorId", { vendorId })
      .getOne();
    if (!vendorProfile) throw new NotFoundException(ERROR_MESSAGES.VENDOR_APPLICATION_NOT_FOUND);

    vendorProfile.status = status;
    vendorProfile.approvedBy = status === VendorStatusEnum.APPROVED ? admin.id : undefined;
    await this.vendorProfileRepository.save(vendorProfile);

    if (status === VendorStatusEnum.APPROVED) {
      await this.userRepository.update({ id: vendorProfile.userId }, { role: UserRoleEnum.VENDOR });
    }
  }
}
