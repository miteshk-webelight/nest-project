import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";

import { ArrayMaxSize, IsArray, IsBoolean, IsOptional } from "class-validator";

import { TrimArrayString } from "src/decorators/trim-array-string.decorator";

import { CreateProductDto } from "./create-product.dto";

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @TrimArrayString()
  @ArrayMaxSize(5)
  removedMediaIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @TrimArrayString()
  @ArrayMaxSize(5)
  newMediaIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
