import type { UsersEntity } from "../users/entity/users.entity";

export type CategoryAdminActionParams<TDto> = {
  id: string;
  dto: TDto;
  admin: UsersEntity;
};
