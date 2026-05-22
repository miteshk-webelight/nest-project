import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsEmail, IsOptional, IsPhoneNumber, IsUrl, Matches, MaxLength, MinLength } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

import { ERROR_MESSAGES } from "../../../constants/app.constants";
import { VALIDATION_REGEX } from "../../../constants/validation.constants";

export class UpdateVendorProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(VALIDATION_REGEX.BUSINESS_NAME, {
    message: "Only letters, numbers, spaces, hyphens and apostrophes",
  })
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL_ADDRESS })
  businessEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @IsPhoneNumber()
  businessPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MinLength(5)
  @MaxLength(200)
  businessAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @TrimString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MaxLength(500)
  description?: string;
}
