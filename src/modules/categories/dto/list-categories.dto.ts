import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional } from "class-validator";

import { PaginationQueryDto } from "src/dto/pagination-query.dto";

export class ListCategoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isActive?: boolean;
}
