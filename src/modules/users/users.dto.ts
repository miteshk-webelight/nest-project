import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import { ERROR_MESSAGES } from "../../constants/app.constants";
import { VALIDATION_REGEX } from "../../constants/validation.constants";
import { TrimString } from "../../decorators/trim-string.decorator";

import { UserRoleEnum, VendorStatusEnum } from "./constants/enum";

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MaxLength(50)
  @Matches(VALIDATION_REGEX.NAME, { message: "Only letters, spaces, hyphens and apostrophes" })
  firstName: string;

  @ApiProperty({ required: false })
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

export class RegisterVendorDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(VALIDATION_REGEX.BUSINESS_NAME, { message: "Only letters, numbers, spaces, hyphens and apostrophes" })
  businessName: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MaxLength(100)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL_ADDRESS })
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  businessEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @IsPhoneNumber()
  businessPhone: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MinLength(5)
  @MaxLength(200)
  businessAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  @TrimString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @TrimString()
  description?: string;
}

export class UpdateVendorStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsIn([VendorStatusEnum.APPROVED, VendorStatusEnum.REJECTED, VendorStatusEnum.SUSPENDED])
  status: Exclude<VendorStatusEnum, VendorStatusEnum.PENDING>;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRoleEnum })
  @IsNotEmpty()
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}
