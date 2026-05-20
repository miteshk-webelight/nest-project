import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";

import { Transform, Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsObject, IsEnum, Min } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

import { AccessControl, ContentDisposition } from "../constants/enum";

export class MultipartDto {
  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({ enum: AccessControl })
  @IsEnum(AccessControl)
  @IsNotEmpty()
  accessControl: AccessControl;

  @ApiProperty({ enum: ContentDisposition })
  @IsEnum(ContentDisposition)
  @IsNotEmpty()
  contentDisposition: ContentDisposition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata: Record<string, AnyType>;
}

export class GeneratePresignedUrlsDto {
  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  uploadId: string;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  totalParts: number;

  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  key: string;
}

export class CompleteMultipartPartDto {
  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  ETag: string;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  PartNumber: number;
}
export class CompleteMultipartDto {
  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  uploadId: string;

  @ApiProperty({ type: [CompleteMultipartPartDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteMultipartPartDto)
  parts: CompleteMultipartPartDto[];

  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  key: string;
}

export class ListUploadedChunksDto extends OmitType(CompleteMultipartDto, ["parts"]) {
  @ApiPropertyOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  @Min(0)
  partNumberMarker?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxParts?: number;
}

export class AbortMultipartDto extends OmitType(CompleteMultipartDto, ["parts"]) {}
