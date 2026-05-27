import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsEnum, IsOptional, MaxLength } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";
import { PaginationQueryDto } from "src/dto/pagination-query.dto";

import { ProductStatusEnum } from "../products.constants";

export class GetAllProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ProductStatusEnum,
  })
  @IsOptional()
  @IsEnum(ProductStatusEnum)
  status?: ProductStatusEnum;

  @ApiPropertyOptional()
  @TrimString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  @TrimString()
  @MaxLength(100)
  @IsOptional()
  name?: string;
}
