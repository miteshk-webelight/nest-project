import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, Matches, MaxLength, MinLength } from "class-validator";

import { VALIDATION_REGEX } from "../../../constants/validation.constants";
import { TrimString } from "../../../decorators/trim-string.decorator";

export class CreateCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @MinLength(2)
  @MaxLength(100)
  @Matches(VALIDATION_REGEX.NAME, { message: "Only letters, numbers, spaces, hyphens and apostrophes" })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MaxLength(500)
  description?: string;
}
