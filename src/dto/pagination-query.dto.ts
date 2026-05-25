import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, MaxLength, Min } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: true })
  @Transform(({ value }) => value !== "false")
  @IsBoolean()
  @IsOptional()
  isPagination?: boolean = true;

  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional()
  @TrimString()
  @MaxLength(100)
  @IsOptional()
  search?: string;
}
