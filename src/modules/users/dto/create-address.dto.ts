import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { IsNotEmpty, IsOptional, IsPostalCode, Matches, MaxLength } from "class-validator";

import { VALIDATION_MESSAGES, VALIDATION_REGEX } from "src/constants/validation.constants";
import { TrimString } from "src/decorators/trim-string.decorator";

export class CreateAddressDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @Matches(VALIDATION_REGEX.INDIAN_MOBILE, { message: VALIDATION_MESSAGES.INVALID_INDIAN_MOBILE })
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MaxLength(255)
  addressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MaxLength(100)
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MaxLength(100)
  state: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MaxLength(100)
  country: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @IsPostalCode("IN", { message: VALIDATION_MESSAGES.INVALID_INDIAN_PIN_CODE })
  postalCode: string;
}
