import { Expose } from "class-transformer";

import { ApiPropertyWritable } from "../../modules/swagger/swagger.writable.decorator";

import type { UserRoleEnum } from "./constants/enum";
import type { PaginationMeta } from "../../types/pagination.types";

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
}

export class UsersListResponse {
  @Expose()
  @ApiPropertyWritable()
  data: UsersResponse[];

  @Expose()
  @ApiPropertyWritable()
  meta: PaginationMeta;
}
