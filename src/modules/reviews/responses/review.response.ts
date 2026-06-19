import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

export class UserInfo {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  fullName: string;

  @Expose()
  @ApiPropertyWritable({ nullable: true })
  avatar?: string;
}

export class ReviewResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @Type(() => UserInfo)
  @ApiPropertyWritable({ type: () => UserInfo })
  user: UserInfo;

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
