import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "src/modules/swagger/swagger.writable.decorator";

export class InitiateMultipartResponseDto {
  @Expose()
  @ApiPropertyWritable()
  uploadId: string;
}

export class CompleteMultipartResponseDto {
  @Expose()
  @ApiPropertyWritable()
  Location: string;
}

export class MultipartPartResponse {
  @Expose()
  @ApiPropertyWritable()
  partNumber: number;

  @Expose()
  @ApiPropertyWritable()
  ETag: string;
}

export class ListUploadedChunksResponseDto {
  @Expose()
  @ApiPropertyWritable({ type: [MultipartPartResponse] })
  @Type(() => MultipartPartResponse)
  parts: MultipartPartResponse[];
}
export class MultipartPresignedUrlPartDto {
  @Expose()
  @ApiPropertyWritable()
  signedUrl: string;

  @Expose()
  @ApiPropertyWritable()
  partNumber: number;
}
export class MultipartPresignedUrlsResponseDto {
  @Expose()
  @ApiPropertyWritable({ type: [MultipartPresignedUrlPartDto] })
  @Type(() => MultipartPresignedUrlPartDto)
  presignedUrls: MultipartPresignedUrlPartDto[];
}
