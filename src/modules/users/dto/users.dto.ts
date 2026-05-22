import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, Matches, MaxLength, MinLength } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

import { ERROR_MESSAGES } from "../../../constants/app.constants";
import { VALIDATION_REGEX } from "../../../constants/validation.constants";
import { UserRoleEnum } from "../user.constants";

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MaxLength(50)
  @Matches(VALIDATION_REGEX.NAME, { message: "Only letters, spaces, hyphens and apostrophes" })
  firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL_ADDRESS })
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(VALIDATION_REGEX.PASSWORD, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, and one special character.",
  })
  password: string;
}

export class CreateAdminDto extends CreateUserDto {}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRoleEnum })
  @IsNotEmpty()
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}
