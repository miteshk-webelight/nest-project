import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "src/modules/swagger/swagger.writable.decorator";

export class PresignedResponseDto {
  @Expose()
  @ApiPropertyWritable()
  signedRequest: string;

  @Expose()
  @ApiPropertyWritable()
  cloudFrontURL: string;
}

export class signUrlRequestBodyDto {
  @Expose()
  @ApiPropertyWritable()
  url: string;

  @Expose()
  @ApiPropertyWritable()
  fields: Record<string, AnyType>;
}

export class PresignedPostResponseDto {
  @Expose()
  @ApiPropertyWritable()
  signedRequest: signUrlRequestBodyDto;

  @Expose()
  @ApiPropertyWritable()
  cloudFrontURL: string;
}
