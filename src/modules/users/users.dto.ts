import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsPhoneNumber } from "class-validator";

import { ERROR_MESSAGES } from "../../constants/app.constants";
import { TrimString } from "../../decorators/trim-string.decorator";

import { UserRoleEnum, VendorStatusEnum } from "./constants/enum";

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @TrimString()
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
  password: string;
}

export class CreateAdminDto extends CreateUserDto {}

export class RegisterVendorDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  businessName: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL_ADDRESS })
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  businessEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  businessPhone: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  businessAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
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
