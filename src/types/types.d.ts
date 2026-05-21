// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

type SearchType = { key: string; value: string };

declare namespace Express {
  export interface Request {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    user: import("src/modules/users/entity/users.entity").UsersEntity;
  }
}
