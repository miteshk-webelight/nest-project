import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsUrl, Matches, MaxLength, MinLength } from "class-validator";

import { ERROR_MESSAGES } from "src/constants/app.constants";
import { VALIDATION_REGEX } from "src/constants/validation.constants";
import { TrimString } from "src/decorators/trim-string.decorator";

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
