import crypto from "crypto";

import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { pagination, transformToInstance } from "../../utils/helper.utils";
import { createPaginationMeta } from "../../utils/pagination.utils";

import { UserRoleEnum } from "./constants/enum";
import { ERROR_MESSAGES } from "./constants/message";
import { FindAllUsersDto } from "./dto/find-all-users.dto";
import { UpdateUserDto } from "./dto/update-user-dto";
import { CreateAdminDto, CreateUserDto } from "./dto/users.dto";
import { UsersEntity } from "./entity/users.entity";
import { UserDetailsResponse } from "./responses/users-details.response";
import { UsersListResponse, UsersResponse } from "./responses/users.response";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
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

  private async findUserById(id: string): Promise<UsersEntity> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.vendorProfiles", "vendorProfiles")
      .where("user.id = :id", { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async getMyProfile(user: UsersEntity): Promise<UserDetailsResponse> {
    const existingUser = await this.findUserById(user.id);

    return transformToInstance(UserDetailsResponse, existingUser) as UserDetailsResponse;
  }

  async updateMyProfile(user: UsersEntity, dto: UpdateUserDto): Promise<void> {
    const existingUser = await this.findUserById(user.id);

    Object.assign(existingUser, dto);

    await this.userRepository.save(existingUser);
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
    if (isDeleted === "true") {
      qb.withDeleted().andWhere("user.deletedAt IS NOT NULL");
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
    const user = await this.findUserById(id);

    return transformToInstance(UserDetailsResponse, user) as UserDetailsResponse;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);

    await this.userRepository.softDelete(user.id);
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
}
