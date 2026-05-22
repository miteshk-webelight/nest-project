import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl, MaxLength } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
