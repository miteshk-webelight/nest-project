import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

export class ReviewResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  userId: string;

  @Expose()
  @ApiPropertyWritable()
  productId: string;

  @Expose()
  @ApiPropertyWritable()
  orderItemId: string;

  @Expose()
  @ApiPropertyWritable()
  title: string;

  @Expose()
  @ApiPropertyWritable()
  comment: string;

  @Expose()
  @ApiPropertyWritable()
  rating: number;

  @Expose()
  @ApiPropertyWritable()
  likesCount: number;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;

  @Expose()
  @ApiPropertyWritable()
  updatedAt: Date;
}
