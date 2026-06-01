import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber } from "class-validator";

import { ERROR_MESSAGES } from "../../../constants/app.constants";
import { TrimString } from "../../../decorators/trim-string.decorator";

export class SignupUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  firstName: string;

  @ApiPropertyOptional()
  @TrimString()
  @IsOptional()
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
  @TrimString()
  @IsNotEmpty()
  password: string;
}

export class LoginUserDto extends OmitType(SignupUserDto, ["firstName", "lastName", "phoneNumber"] as const) {}
