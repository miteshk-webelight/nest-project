import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import { VALIDATION_MESSAGES, VALIDATION_REGEX } from "../../../constants/validation.constants";
import { TrimString } from "../../../decorators/trim-string.decorator";

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(VALIDATION_REGEX.SKU, { message: VALIDATION_MESSAGES.INVALID_SKU })
  sku: string;

  @ApiProperty()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0.01)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0.01)
  discountPrice?: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  images: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0)
  @Max(999999)
  stock: number;
}
