import { Expose, Type } from "class-transformer";

import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

import type { PaginationMeta } from "../../../types/pagination.types";
import type { UserRoleEnum } from "../user.constants";

export class UsersResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  firstName: string;

  @Expose()
  @ApiPropertyWritable()
  lastName?: string;

  @Expose()
  @ApiPropertyWritable()
  email: string;

  @Expose()
  @ApiPropertyWritable()
  phoneNumber: string;

  @Expose()
  @ApiPropertyWritable()
  role: UserRoleEnum;

  @Expose()
  @ApiPropertyWritable()
  createdAt: Date;
}

export class UsersListResponse {
  @Expose()
  @Type(() => UsersResponse)
  @ApiPropertyWritable()
  data: UsersResponse[];

  @Expose()
  @ApiPropertyWritable()
  meta: PaginationMeta;
}
