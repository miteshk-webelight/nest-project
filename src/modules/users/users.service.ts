import crypto from "crypto";

import { HttpService } from "@nestjs/axios";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { firstValueFrom } from "rxjs";
import { Repository, SelectQueryBuilder } from "typeorm";

import { SortOrderEnum } from "src/constants/common.constants";

import { applyPagination } from "../../utils/helper.utils";
import { createPaginationMeta } from "../../utils/pagination.utils";
import { DatabaseService } from "../database/database.service";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";

import { CreateAddressDto } from "./dto/create-address.dto";
import { FindAllUsersDto } from "./dto/find-all-users.dto";
import { UpdateUserDto } from "./dto/update-user-dto";
import { CreateAdminDto, CreateUserDto } from "./dto/users.dto";
import { AddressEntity } from "./entity/address.entity";
import { UsersEntity } from "./entity/users.entity";
import { UsersListResponse } from "./responses/users.response";
import {
  ADDRESS_ERROR_MESSAGES,
  ADDRESS_SELECT_FIELDS,
  ERROR_MESSAGES,
  POSTAL_VERIFICATION_URL,
  USER_DETAILS_SELECT_FIELDS,
  USER_LIST_SELECT_FIELDS,
  UserRoleEnum,
  UserSortByEnum,
} from "./user.constants";
import { validateAddress } from "./utils/postal-validation.util";
import { validateUserUniqueFields, validateUserUpdatePayload } from "./utils/user-valiation.utils";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,

    private readonly databaseService: DatabaseService,
    private readonly httpService: HttpService,
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

  private async findUserById(id: string): Promise<Partial<UsersEntity>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.vendorProfiles", "vendorProfiles")
      .select(USER_DETAILS_SELECT_FIELDS)
      .where("user.id = :id", { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async getMyProfile(user: UsersEntity): Promise<Partial<UsersEntity>> {
    return this.findUserById(user.id);
  }

  async updateMyProfile(user: UsersEntity, dto: UpdateUserDto): Promise<void> {
    await this.validateUserProfileUpdate(user.id, dto);

    await this.userRepository.update(
      {
        id: user.id,
      },
      dto,
    );
  }

  private async validateUserProfileUpdate(userId: string, dto: UpdateUserDto): Promise<void> {
    validateUserUpdatePayload(dto);

    const existingUser = await this.userRepository
      .createQueryBuilder("user")
      .select(["user.id", "user.phoneNumber"])
      .where("user.phoneNumber = :phoneNumber", {
        phoneNumber: dto.phoneNumber ?? "",
      })
      .andWhere("user.id != :userId", {
        userId,
      })
      .getOne();

    validateUserUniqueFields(dto, existingUser);
  }
  async findAll(query: FindAllUsersDto): Promise<UsersListResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = UserSortByEnum.CREATED_AT,
      sortOrder = SortOrderEnum.DESC,
      isPagination = true,
    } = query;

    if (!Object.values(UserSortByEnum).includes(sortBy as UserSortByEnum)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_SORT_FIELD);
    }

    const qb = this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.vendorProfiles", "vendorProfile")
      .select(USER_LIST_SELECT_FIELDS);

    this.applyUserFilters(qb, query);

    qb.orderBy(`user.${sortBy}`, sortOrder);

    applyPagination(qb, {
      page,
      limit,
      isPagination,
    });

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  private applyUserFilters(qb: SelectQueryBuilder<UsersEntity>, query: FindAllUsersDto): void {
    const { search, role, isDeleted, vendorStatus } = query;

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
      qb.andWhere("user.role = :role", { role });
    }

    // soft delete
    if (isDeleted === "true") {
      qb.withDeleted().andWhere("user.deletedAt IS NOT NULL");
    }

    // vendor status
    if (vendorStatus) {
      qb.andWhere("vendorProfile.status = :vendorStatus", { vendorStatus });
    }
  }

  async findOne(id: string): Promise<Partial<UsersEntity>> {
    return this.findUserById(id);
  }

  private async validateUserDeletion(userId: string): Promise<void> {
    const vendorProfileExists = await this.userRepository.manager
      .getRepository(VendorProfileEntity)
      .createQueryBuilder("vendor")
      .select("vendor.id")
      .where("vendor.userId = :userId", {
        userId,
      })
      .getOne();

    if (vendorProfileExists) {
      throw new ConflictException(ERROR_MESSAGES.USER_LINKED_WITH_VENDOR_PROFILE);
    }
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);

    await this.validateUserDeletion(user.id!);

    await this.userRepository.softDelete(user.id!);
  }

  async restoreUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // User is already active
    if (!user.deletedAt) {
      throw new ConflictException(ERROR_MESSAGES.USER_ALREADY_ACTIVE);
    }

    await this.userRepository.restore(id);
  }

  async addUserAddress(userId: string, dto: CreateAddressDto): Promise<AddressEntity> {
    try {
      const response = await firstValueFrom(this.httpService.get(POSTAL_VERIFICATION_URL(dto.postalCode)));

      validateAddress(response.data, dto.city, dto.state, dto.postalCode);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(ADDRESS_ERROR_MESSAGES.POSTAL_SERVICE_ERROR);
    }

    const addressRepo = this.databaseService.getRepository(AddressEntity);

    const newAddress = addressRepo.create({
      ...dto,
      userId,
    });

    return addressRepo.save(newAddress);
  }

  async getUserAddresses(userId: string): Promise<AddressEntity[]> {
    const addressRepo = this.databaseService.getRepository(AddressEntity);

    return await addressRepo
      .createQueryBuilder("addresses")
      .select(ADDRESS_SELECT_FIELDS)
      .where("addresses.userId = :userId", { userId })
      .orderBy("addresses.createdAt", SortOrderEnum.DESC)
      .getMany();
  }
}
