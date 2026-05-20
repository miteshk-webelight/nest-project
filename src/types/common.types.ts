import { ApiPropertyOptional } from "@nestjs/swagger";

import { Type, Transform } from "class-transformer";
import { IsOptional, IsNumber, Min } from "class-validator";
import { Request } from "express";

import { TrimString } from "../decorators/trim-string.decorator";
import { UsersEntity } from "../modules/users/users.entity";

export interface RequestUser extends Request {
  user: UsersEntity;
}

export class PaginationDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @Min(1)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  search?: string;
}
