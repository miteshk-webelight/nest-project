import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, Max, MaxLength, Min } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

export class ListCategoriesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    default: "createdAt",
  })
  @IsOptional()
  @IsIn(["createdAt", "name"])
  sortBy?: string = "createdAt";

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";

  @ApiPropertyOptional({
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
