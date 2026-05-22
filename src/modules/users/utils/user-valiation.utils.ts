import { BadRequestException, ConflictException } from "@nestjs/common";

import { ERROR_MESSAGES } from "../user.constants";

import type { UpdateUserDto } from "../dto/update-user-dto";
import type { UsersEntity } from "../entity/users.entity";

export function validateUserUpdatePayload(dto: UpdateUserDto): void {
  if (Object.keys(dto).length === 0) {
    throw new BadRequestException(ERROR_MESSAGES.NO_UPDATE_FIELDS_PROVIDED);
  }
}

export function validateUserUniqueFields(dto: UpdateUserDto, existingUser: UsersEntity | null): void {
  if (!existingUser) {
    return;
  }

  if (dto.phoneNumber && dto.phoneNumber === existingUser.phoneNumber) {
    throw new ConflictException(ERROR_MESSAGES.PHONE_NUMBER_ALREADY_EXISTS);
  }
}
