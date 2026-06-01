import type { UsersEntity } from "../users/entity/users.entity";

export type CartOwner = {
  user?: UsersEntity;
  guestToken?: string;
};
