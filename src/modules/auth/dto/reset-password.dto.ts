import { ApiProperty } from "@nestjs/swagger";

import { IsEmail, IsNotEmpty } from "class-validator";

import { ERROR_MESSAGES } from "src/constants/app.constants";
import { TrimString } from "src/decorators/trim-string.decorator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  token: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  password: string;
}

export class EmailDto {
  @ApiProperty()
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL_ADDRESS })
  @IsNotEmpty()
  @TrimString()
  email: string;
}
