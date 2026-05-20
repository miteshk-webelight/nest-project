import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { IsNotEmpty, IsEnum, IsObject, IsOptional } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

import { AccessControl } from "../constants/enum";

export class PresignDto {
  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({ enum: AccessControl })
  @IsEnum(AccessControl)
  @IsNotEmpty()
  accessControl: AccessControl;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata: Record<string, AnyType>;
}
