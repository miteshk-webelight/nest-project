import { Expose, Type } from "class-transformer";

import { PaginationMetaResponse } from "../../../types/pagination.types";
import { ApiPropertyWritable } from "../../swagger/swagger.writable.decorator";

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
  @ApiPropertyWritable({ type: () => UsersResponse, isArray: true })
  data: UsersResponse[];

  @Expose()
  @ApiPropertyWritable({ type: () => PaginationMetaResponse })
  meta: PaginationMetaResponse;
}
